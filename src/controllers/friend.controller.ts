import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { FriendRequest } from '../models/FriendRequest';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { RequestWithUser } from '../types';
import { socketService } from '../services/socket.service';
import { createAndEmit } from '../services/notification.service';

class FriendController {
  /**
   * Send a friend request
   */
  sendFriendRequest = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const fromUserId = (req.user as any)?.id;
      const { toUserId, triggeredFromPostId } = req.body;

      // Validation
      if (!toUserId) {
        res.status(400).json({ message: 'Recipient user ID is required.' });
        return;
      }

      if (!Types.ObjectId.isValid(toUserId)) {
        res.status(400).json({ message: 'Invalid recipient user ID.' });
        return;
      }

      // Check if trying to add self
      if (fromUserId === toUserId) {
        res.status(400).json({ message: 'Cannot send friend request to yourself.' });
        return;
      }

      // Check if recipient exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        res.status(404).json({ message: 'Recipient user not found.' });
        return;
      }

      // Check if sender exists
      const fromUser = await User.findById(fromUserId);
      if (!fromUser) {
        res.status(404).json({ message: 'Sender user not found.' });
        return;
      }

      // Check if already friends
      const alreadyFriends = fromUser.friends?.some(
        (friendId) => friendId.toString() === toUserId
      );
      if (alreadyFriends) {
        res.status(400).json({ message: 'You are already friends with this user.' });
        return;
      }

      // Check and handle existing friend requests
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { from: fromUserId, to: toUserId },
          { from: toUserId, to: fromUserId },
        ],
      });

      if (existingRequest) {
        // If there's a pending request from either side
        if (existingRequest.status === 'pending') {
          res.status(400).json({ message: 'Friend request already exists.' });
          return;
        }
        
        // If there's an old accepted/rejected request, delete it and create new
        if (existingRequest.status === 'accepted' || existingRequest.status === 'rejected') {
          await FriendRequest.deleteOne({ _id: existingRequest._id });
        }
      }

      // Create friend request
      const requestData: any = {
        from: fromUserId,
        to: toUserId,
      };

      if (triggeredFromPostId && Types.ObjectId.isValid(triggeredFromPostId)) {
        requestData.triggeredFromPostId = triggeredFromPostId;
      }

      const friendRequest = await FriendRequest.create(requestData);

      // Populate the request for response
      const populatedRequest = await FriendRequest.findById(friendRequest._id)
        .populate('from', 'name email photo')
        .populate('to', 'name email photo');

      // Emit socket event to recipient
      try {
        socketService.emitToUser(toUserId, 'friend:request:received', {
          request: populatedRequest,
          message: `${fromUser.name} sent you a friend request`,
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      // Create notification
      await createAndEmit(toUserId, 'friend_request', {
        fromUserId,
        friendRequestId: friendRequest._id.toString(),
      });

      res.status(201).json({
        message: 'Friend request sent successfully.',
        request: populatedRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Accept a friend request
   */
  acceptFriendRequest = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;
      const { requestId } = req.params;

      if (!Types.ObjectId.isValid(requestId)) {
        res.status(400).json({ message: 'Invalid request ID.' });
        return;
      }

      // Find the friend request
      const friendRequest = await FriendRequest.findById(requestId);

      if (!friendRequest) {
        res.status(404).json({ message: 'Friend request not found.' });
        return;
      }

      // Verify the authenticated user is the recipient
      if (friendRequest.to.toString() !== userId) {
        res.status(403).json({ message: 'You are not authorized to accept this request.' });
        return;
      }

      // Check if request is still pending
      if (friendRequest.status !== 'pending') {
        res.status(400).json({ message: 'This request has already been processed.' });
        return;
      }

      const fromUserId = friendRequest.from.toString();
      const toUserId = friendRequest.to.toString();

      // Update both users' friends arrays
      await User.findByIdAndUpdate(fromUserId, {
        $addToSet: { friends: toUserId },
      });

      await User.findByIdAndUpdate(toUserId, {
        $addToSet: { friends: fromUserId },
      });

      // Update friend request status
      friendRequest.status = 'accepted';
      await friendRequest.save();

      // Create or find chat room
      const sortedParticipants = [fromUserId, toUserId]
        .map((id) => new Types.ObjectId(id))
        .sort((a, b) => a.toString().localeCompare(b.toString()));

      let chat = await Chat.findOne({
        participants: sortedParticipants,
      });

      if (!chat) {
        chat = await Chat.create({
          participants: sortedParticipants,
        });
      }

      // Get populated request for response
      const populatedRequest = await FriendRequest.findById(requestId)
        .populate('from', 'name email photo')
        .populate('to', 'name email photo');

      // Get user data for socket event
      const acceptingUser = await User.findById(userId).select('name email photo');

      // Emit socket event to requester
      try {
        socketService.emitToUser(fromUserId, 'friend:request:accepted', {
          request: populatedRequest,
          chatId: chat._id,
          message: `${acceptingUser?.name} accepted your friend request`,
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      // Create notification
      await createAndEmit(fromUserId, 'friend_accepted', {
        fromUserId: userId,
        friendRequestId: requestId,
      });

      res.json({
        message: 'Friend request accepted successfully.',
        request: populatedRequest,
        chatId: chat._id,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject a friend request
   */
  rejectFriendRequest = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;
      const { requestId } = req.params;

      if (!Types.ObjectId.isValid(requestId)) {
        res.status(400).json({ message: 'Invalid request ID.' });
        return;
      }

      // Find the friend request
      const friendRequest = await FriendRequest.findById(requestId);

      if (!friendRequest) {
        res.status(404).json({ message: 'Friend request not found.' });
        return;
      }

      // Verify the authenticated user is the recipient
      if (friendRequest.to.toString() !== userId) {
        res.status(403).json({ message: 'You are not authorized to reject this request.' });
        return;
      }

      // Check if request is still pending
      if (friendRequest.status !== 'pending') {
        res.status(400).json({ message: 'This request has already been processed.' });
        return;
      }

      // Update friend request status
      friendRequest.status = 'rejected';
      await friendRequest.save();

      // Get populated request for response
      const populatedRequest = await FriendRequest.findById(requestId)
        .populate('from', 'name email photo')
        .populate('to', 'name email photo');

      // Get user data for socket event
      const rejectingUser = await User.findById(userId).select('name email photo');

      // Emit socket event to requester
      try {
        socketService.emitToUser(friendRequest.from.toString(), 'friend:request:rejected', {
          request: populatedRequest,
          message: `${rejectingUser?.name} rejected your friend request`,
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      res.json({
        message: 'Friend request rejected successfully.',
        request: populatedRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unfriend a user
   */
  unfriend = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;
      const { friendId } = req.params;

      if (!Types.ObjectId.isValid(friendId)) {
        res.status(400).json({ message: 'Invalid friend ID.' });
        return;
      }

      // Check if they are actually friends
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      const isFriend = user.friends?.some(
        (id) => id.toString() === friendId
      );

      if (!isFriend) {
        res.status(400).json({ message: 'You are not friends with this user.' });
        return;
      }

      // Remove from both users' friends arrays
      await User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId },
      });

      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId },
      });

      // Delete any friend requests between these users
      await FriendRequest.deleteMany({
        $or: [
          { from: userId, to: friendId },
          { from: friendId, to: userId },
        ],
      });

      // Get user data for socket event
      const unfriendingUser = await User.findById(userId).select('name email photo');

      // Emit socket event to unfriended user
      try {
        socketService.emitToUser(friendId, 'friend:removed', {
          userId: userId,
          message: `${unfriendingUser?.name} removed you from their friends`,
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      res.json({
        message: 'Friend removed successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's friends list
   */
  getFriends = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;

      const user = await User.findById(userId).populate(
        'friends',
        'name email photo'
      ).lean();

      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      const friendsWithStatus = (user.friends || []).map((friend: any) => ({
        ...friend,
        _id: friend._id.toString(),
        isOnline: socketService.isUserOnline(friend._id.toString()),
      }));

      res.json({
        friends: friendsWithStatus,
        count: friendsWithStatus.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pending friend requests for the authenticated user
   */
  getPendingRequests = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;

      const requests = await FriendRequest.find({
        to: userId,
        status: 'pending',
      })
        .populate('from', 'name email photo')
        .populate('triggeredFromPostId', 'content media')
        .sort({ createdAt: -1 });

      res.json({
        requests,
        count: requests.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const friendController = new FriendController();

