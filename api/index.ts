import { app } from '../src/server';
import { connectDatabase } from '../src/config/database';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the database connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  await connectDatabase();
  isConnected = true;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  await connectToDatabase();
  app(req, res);
};
