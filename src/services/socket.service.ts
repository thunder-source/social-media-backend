import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from '../socket/socketHandlers';

let io: Server | null = null;

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ?? '*',
    },
  });

  registerSocketHandlers(io);

  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error('Socket server not initialized');
  }

  return io;
};

