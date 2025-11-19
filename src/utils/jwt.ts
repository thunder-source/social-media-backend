import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'development-secret';

export const generateToken = (payload: object, expiresIn = '7d'): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string): string | JwtPayload =>
  jwt.verify(token, JWT_SECRET);

