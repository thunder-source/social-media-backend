import { Request, Response, NextFunction } from 'express';
import { FriendRequest } from '../models/FriendRequest';

class FriendController {
  sendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requester, recipient } = req.body;

      if (!requester || !recipient) {
        res.status(400).json({ message: 'Requester and recipient are required.' });
        return;
      }

      const request = await FriendRequest.create({ requester, recipient });

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

