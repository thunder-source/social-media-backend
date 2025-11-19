import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'development-secret';

export const generateToken = (
  payload: object,
  expiresIn: SignOptions['expiresIn'] = '7d'
): string => jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string): string | JwtPayload =>
  jwt.verify(token, JWT_SECRET);

