import { Server, Socket } from 'socket.io';

const handleConnection = (socket: Socket): void => {
  const userId = socket.handshake.auth?.userId as string | undefined;

  if (userId) {
    socket.join(userId);
  }

  socket.on('disconnect', () => {
    // Placeholder for disconnect logic.
  });
};

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', handleConnection);
};

