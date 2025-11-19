import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';

class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required.' });
        return;
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(409).json({ message: 'User already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.password) {
        res.status(401).json({ message: 'Invalid credentials.' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        res.status(401).json({ message: 'Invalid credentials.' });
        return;
      }

      const token = generateToken({ id: user._id, email: user.email });

      res.json({ token, user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

