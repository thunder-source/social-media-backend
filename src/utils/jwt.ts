import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'development-secret';
const DEFAULT_EXPIRATION = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export interface TokenPayload extends JwtPayload {
  sub: string;
}

export const generateToken = (userId: string, expiresIn: SignOptions['expiresIn'] = DEFAULT_EXPIRATION): string =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Invalid token payload');
  }

  return decoded as TokenPayload;
};


