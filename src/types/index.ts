import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface RequestWithUser extends Request {
  user?: (JwtPayload & { id?: string }) | { id?: string } | string;
}

