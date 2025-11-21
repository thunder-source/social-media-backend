import webpush from 'web-push';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { getSocket } from './socket.service';

// Configure web-push
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:noreply@example.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
}

interface NotificationData {
  fromUserId: string;
  postId?: string;
  friendRequestId?: string;
  message?: string;
}

export const createAndEmit = async (
  userId: string,
  type: NotificationType,
  data: NotificationData
) => {
  const fromUser = await User.findById(data.fromUserId);
  if (!fromUser) {
    console.error(`Notification sender ${data.fromUserId} not found`);
    return null;
  }

  let message = data.message;
  if (!message) {
    switch (type) {
      case 'friend_request':
        message = `${fromUser.name} wants to connect`;
        break;
      case 'friend_accepted':
        message = `${fromUser.name} accepted your request`;
        break;
      case 'new_message':
        message = `New message from ${fromUser.name}`;
        break;
      case 'post_like':
        message = `${fromUser.name} liked your post`;
        break;
      case 'post_comment':
        message = `${fromUser.name} commented on your post`;
        break;
      default:
        message = 'New notification';
    }
  }

  const notification = await Notification.create({
    userId,
    type,
    fromUser: data.fromUserId,
    message,
    postId: data.postId,
    friendRequestId: data.friendRequestId,
  });

  // Emit via Socket.IO
  try {
    const io = getSocket();
    io.to(userId.toString()).emit('notification', notification);
  } catch (error) {
    console.error('Socket emit error:', error);
  }

  // Send Push Notification
  try {
    const user = await User.findById(userId);
    if (user?.pushSubscription) {
      const payload = JSON.stringify({
        title: 'New Notification',
        body: message,
        icon: fromUser.photo || '/default-avatar.png',
        data: {
          url: process.env.FRONTEND_URL || 'http://localhost:3000',
          notificationId: notification._id
        }
      });
      await webpush.sendNotification(user.pushSubscription, payload);
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }

  return notification;
};
