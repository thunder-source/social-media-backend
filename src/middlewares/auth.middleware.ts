import { Request, Response, RequestHandler } from 'express';
import { Types } from 'mongoose';
import { verifyToken as verifyJwtToken } from '../utils/jwt';
import { RequestWithUser } from '../types';
import { User } from '../models/User';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'auth_token';

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const requestWithCookies = req as RequestWithCookies;
  return requestWithCookies.cookies?.[AUTH_COOKIE_NAME] ?? parseCookieHeader(req.headers.cookie);
};

const parseCookieHeader = (cookieHeader?: string): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));

  return tokenCookie?.split('=')[1];
};

export const verifyToken: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ message: 'Authentication token missing.' });
      return;
    }

    const payload = verifyJwtToken(token);
    const userId = payload.sub;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Invalid token payload.' });
      return;
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    const requestWithUser = req as RequestWithUser;

    requestWithUser.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photo: user.photo,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};


