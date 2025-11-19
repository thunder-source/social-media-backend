import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';

class NotificationController {
  listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndUpdate(
        id,
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
}

export const notificationController = new NotificationController();

