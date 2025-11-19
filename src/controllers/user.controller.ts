import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

class UserController {
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password');

      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');

      if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();

