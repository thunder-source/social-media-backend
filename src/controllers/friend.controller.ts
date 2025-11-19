import { Request, Response, NextFunction } from 'express';
import { FriendRequest } from '../models/FriendRequest';

class FriendController {
  sendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to, triggeredFromPostId } = req.body;

      if (!from || !to) {
        res.status(400).json({ message: 'Sender and recipient are required.' });
        return;
      }

      const request = await FriendRequest.create({ from, to, triggeredFromPostId });

      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  };

  respondRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const request = await FriendRequest.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!request) {
        res.status(404).json({ message: 'Friend request not found.' });
        return;
      }

      res.json(request);
    } catch (error) {
      next(error);
    }
  };
}

export const friendController = new FriendController();

