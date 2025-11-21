import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { RequestWithUser } from '../types';

class ChatController {
  /**
   * Create or get existing chat between two users
   */
  createOrGetChat = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId1, userId2 } = req.body;

      if (!userId1 || !userId2) {
        res.status(400).json({ message: 'Both userId1 and userId2 are required.' });
        return;
      }

      if (!Types.ObjectId.isValid(userId1) || !Types.ObjectId.isValid(userId2)) {
        res.status(400).json({ message: 'Invalid user IDs provided.' });
        return;
      }

      if (userId1 === userId2) {
        res.status(400).json({ message: 'Cannot create chat with yourself.' });
        return;
      }

      // Ensure authenticated user is one of the participants
      const currentUserId = (req.user as any)?.id;
      if (currentUserId !== userId1 && currentUserId !== userId2) {
        res.status(403).json({ message: 'You can only create chats where you are a participant.' });
        return;
      }

      const participants = [new Types.ObjectId(userId1), new Types.ObjectId(userId2)].sort(
        (a, b) => a.toString().localeCompare(b.toString())
      );

      // Try to find existing chat
      let chat = await Chat.findOne({ participants })
        .populate('participants', 'name email photo')
        .populate({
          path: 'lastMessage',
          populate: { path: 'senderId', select: 'name email photo' }
        });

      // Create new chat if doesn't exist
      if (!chat) {
        chat = await Chat.create({ participants });
        chat = await Chat.findById(chat._id)
          .populate('participants', 'name email photo')
          .populate({
            path: 'lastMessage',
            populate: { path: 'senderId', select: 'name email photo' }
          });
      }

      res.status(200).json(chat);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all chats for the authenticated user with last message
   */
  getChats = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }

      const userObjectId = new Types.ObjectId(userId);

      const chats = await Chat.find({ participants: userObjectId })
        .populate('participants', 'name email photo')
        .populate({
          path: 'lastMessage',
          populate: { path: 'senderId', select: 'name email photo' }
        })
        .sort({ updatedAt: -1 });

      res.status(200).json(chats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get messages for a specific chat with pagination
   */
  getChatMessages = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!Types.ObjectId.isValid(chatId)) {
        res.status(400).json({ message: 'Invalid chat ID.' });
        return;
      }

      // Verify user is participant in this chat
      const userId = (req.user as any)?.id;
      const chat = await Chat.findById(chatId);

      if (!chat) {
        res.status(404).json({ message: 'Chat not found.' });
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => participantId.toString() === userId
      );

      if (!isParticipant) {
        res.status(403).json({ message: 'You are not a participant in this chat.' });
        return;
      }

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find({ chatId: new Types.ObjectId(chatId) })
          .populate('senderId', 'name email photo')
          .populate('readBy', 'name email photo')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Message.countDocuments({ chatId: new Types.ObjectId(chatId) })
      ]);

      res.status(200).json({
        messages: messages.reverse(), // Return in ascending order (oldest first)
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a new message in a chat
   */
  sendMessage = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chatId } = req.params;
      const { text } = req.body;
      const senderId = (req.user as any)?.id;

      if (!Types.ObjectId.isValid(chatId)) {
        res.status(400).json({ message: 'Invalid chat ID.' });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(400).json({ message: 'Message text is required.' });
        return;
      }

      // Verify chat exists and user is participant
      const chat = await Chat.findById(chatId);

      if (!chat) {
        res.status(404).json({ message: 'Chat not found.' });
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => participantId.toString() === senderId
      );

      if (!isParticipant) {
        res.status(403).json({ message: 'You are not a participant in this chat.' });
        return;
      }

      // Create message with sender already in readBy
      const message = await Message.create({
        chatId: new Types.ObjectId(chatId),
        senderId: new Types.ObjectId(senderId),
        text: text.trim(),
        readBy: [new Types.ObjectId(senderId)]
      });

      // Update chat's lastMessage and updatedAt
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      // Populate message before returning
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name email photo')
        .populate('readBy', 'name email photo');

      res.status(201).json(populatedMessage);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark a message as read by the authenticated user
   */
  markAsRead = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = (req.user as any)?.id;

      if (!Types.ObjectId.isValid(messageId)) {
        res.status(400).json({ message: 'Invalid message ID.' });
        return;
      }

      const message = await Message.findById(messageId).populate('chatId');

      if (!message) {
        res.status(404).json({ message: 'Message not found.' });
        return;
      }

      // Verify user is participant in the chat
      const chat = await Chat.findById(message.chatId);

      if (!chat) {
        res.status(404).json({ message: 'Chat not found.' });
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => participantId.toString() === userId
      );

      if (!isParticipant) {
        res.status(403).json({ message: 'You are not a participant in this chat.' });
        return;
      }

      // Add user to readBy if not already there
      const userObjectId = new Types.ObjectId(userId);
      const alreadyRead = message.readBy?.some(
        (readByUserId) => readByUserId.toString() === userId
      );

      if (!alreadyRead) {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: userObjectId }
        });
      }

      const updatedMessage = await Message.findById(messageId)
        .populate('senderId', 'name email photo')
        .populate('readBy', 'name email photo');

      res.status(200).json(updatedMessage);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper: Check if user is participant in chat (for middleware)
   */
  isParticipant = async (chatId: string, userId: string): Promise<boolean> => {
    try {
      if (!Types.ObjectId.isValid(chatId)) {
        return false;
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return false;
      }

      return chat.participants.some(
        (participantId) => participantId.toString() === userId
      );
    } catch (error) {
      return false;
    }
  };
}

export const chatController = new ChatController();

