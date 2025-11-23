import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import chatRoutes from './routes/chat.routes';
import friendRoutes from './routes/friend.routes';
import notificationRoutes from './routes/notification.routes';
import socketDocsRoutes from './routes/socket-docs.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middlewares/error.middleware';
import { setupSwagger } from './config/swagger';
import { initializeSocket } from './services/socket.service';

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'session-secret';

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

configurePassport();
setupSwagger(app);

app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', chatRoutes); // For /api/messages/:messageId/read endpoint
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/docs', socketDocsRoutes);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = http.createServer(app);
  initializeSocket(server);

  const port = process.env.PORT ?? 5000;

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});

export { app };

