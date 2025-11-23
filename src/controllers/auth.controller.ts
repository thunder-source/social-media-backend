import passport from 'passport';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { RequestWithUser } from '../types';
import { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';

type PassportUser = Express.User &
  Omit<Partial<IUser>, '_id'> & {
    _id?: Types.ObjectId | string;
  };
type SanitizedUser = {
  id: string;
  email?: string;
  name?: string;
  photo?: string;
};

class AuthController {
  private readonly cookieName = process.env.AUTH_COOKIE_NAME ?? 'auth_token';

  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    // Must be true for production (HTTPS required for sameSite: 'none')
    secure: process.env.NODE_ENV === 'production',
    // 'none' is required for cross-origin requests in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: Number(process.env.JWT_COOKIE_MAX_AGE ?? 7 * 24 * 60 * 60 * 1000),
    // Don't set domain - let browser handle it for cross-origin cookies
    domain: "https://social.pradityamanjhi.in",
  };

  private readonly successRedirect = process.env.GOOGLE_SUCCESS_REDIRECT;
  private readonly failureRedirect = process.env.GOOGLE_FAILURE_REDIRECT;

  googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  });

  googleCallback = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('google', { session: false }, (error: Error | null, user?: PassportUser) => {
      if (error) {
        next(error);
        return;
      }

      if (!user?._id) {
        if (this.failureRedirect) {
          res.redirect(this.failureRedirect);
          return;
        }

        res.status(401).json({ message: 'Google authentication failed.' });
        return;
      }

      try {
        const token = generateToken(user._id.toString());
        const sanitizedUser = this.sanitizeUser(user);

        res.cookie(this.cookieName, token, this.cookieOptions);

        if (this.successRedirect) {
          res.redirect(this.successRedirect);
          return;
        }

        res.status(200).json({ token, user: sanitizedUser });
      } catch (tokenError) {
        next(tokenError);
      }
    })(req, res, next);
  };

  logout = (req: Request, res: Response): void => {
    res.clearCookie(this.cookieName, {
      httpOnly: this.cookieOptions.httpOnly,
      secure: this.cookieOptions.secure,
      sameSite: this.cookieOptions.sameSite,
      domain: this.cookieOptions.domain,
    });

    this.logoutFromPassport(req);
    res.status(200).json({ message: 'Logged out successfully.' });
  };

  getCurrentUser = (req: RequestWithUser, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    res.status(200).json({ user: req.user });
  };

  private sanitizeUser(user: PassportUser): SanitizedUser {
    const id = user._id?.toString();

    if (!id) {
      throw new Error('Unable to determine user id.');
    }

    return {
      id,
      email: user.email,
      name: user.name,
      photo: user.photo,
    };
  }

  private logoutFromPassport(req: Request): void {
    const requestWithLogout = req as Request & {
      logout?: (callback: (err?: unknown) => void) => void;
    };

    requestWithLogout.logout?.(() => undefined);
  }
}

export const authController = new AuthController();

