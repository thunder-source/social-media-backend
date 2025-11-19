import { Notification, NotificationType } from '../models/Notification';
import { getSocket } from './socket.service';

interface NotifyUserOptions {
  type: NotificationType;
  fromUser: string;
  message: string;
  postId?: string;
  friendRequestId?: string;
}

export const notifyUser = async (
  userId: string,
  { type, fromUser, message, postId, friendRequestId }: NotifyUserOptions
) => {
  const notification = await Notification.create({
    userId,
    type,
    fromUser,
    message,
    postId,
    friendRequestId,
  });

  try {
    const io = getSocket();
    io.to(userId).emit('notification', notification);
  } catch {
    // Socket server not initialized, ignore for now.
  }

  return notification;
};

