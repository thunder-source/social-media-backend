import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  photo?: string;
}

export type RequestWithUser = Request & {
  user?: AuthenticatedUser | Express.User;
};




