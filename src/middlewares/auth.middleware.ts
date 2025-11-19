import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { RequestWithUser } from '../types';

export const authenticate = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication token missing.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = typeof payload === 'string' ? { id: payload } : payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.', error });
  }
};

