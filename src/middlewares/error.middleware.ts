import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
};

