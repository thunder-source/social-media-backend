import { Notification } from '../models/Notification';
import { getSocket } from './socket.service';

export const notifyUser = async (
  userId: string,
  message: string,
  type = 'generic',
  metadata?: Record<string, unknown>
) => {
  const notification = await Notification.create({
    user: userId,
    message,
    type,
    metadata,
  });

  try {
    const io = getSocket();
    io.to(userId).emit('notification', notification);
  } catch {
    // Socket server not initialized, ignore for now.
  }

  return notification;
};

