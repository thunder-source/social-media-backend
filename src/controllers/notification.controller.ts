import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { RequestWithUser, AuthenticatedUser } from '../types';

class NotificationController {
  getNotifications = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const userId = user.id;
      const { unreadOnly } = req.query;

      const query: any = { userId };
      if (unreadOnly === 'true') {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .populate('fromUser', 'name photo')
        .populate('postId', 'content')
        .limit(50);

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: user.id },
        { read: true },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ message: 'Notification not found.' });
        return;
      }

      res.json(notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const userId = user.id;
      await Notification.updateMany(
        { userId, read: false },
        { read: true }
      );

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;
      const notification = await Notification.findOneAndDelete({ _id: id, userId: user.id });

      if (!notification) {
        res.status(404).json({ message: 'Notification not found.' });
        return;
      }

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  };

  subscribe = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser;
      const userId = user.id;
      const subscription = req.body;

      await User.findByIdAndUpdate(userId, { pushSubscription: subscription });

      res.status(201).json({ message: 'Subscription added successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
