import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { registerSocketHandlers } from '../socket/socketHandlers';
import { User } from '../models/User';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient, isRedisEnabled } from '../config/redis';

/**
 * SocketService class to manage Socket.io connections and event emissions
 */
export class SocketService {
  private io: Server | null = null;
  private userConnections: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize Socket.io server with CORS configuration
   */
  initializeSocket(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL ?? '*',
        credentials: true,
      },
    });

    if (isRedisEnabled && redisClient) {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();

      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        if (this.io) {
          this.io.adapter(createAdapter(pubClient, subClient));
          console.log('Socket.IO Redis adapter configured');
        }
      }).catch(err => {
        console.error('Failed to connect Redis adapter clients', err);
      });
    }

    registerSocketHandlers(this.io, this);

    return this.io;
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): Server {
    if (!this.io) {
      throw new Error('Socket server not initialized');
    }
    return this.io;
  }

  /**
   * Add a user connection to the tracking map
   * Note: With Redis adapter, we rely on rooms, but we keep this for logging
   */
  addUserConnection(userId: string, socketId: string): void {
    this.userConnections.set(userId, socketId);
    console.log(`User ${userId} connected with socket ${socketId}`);
  }

  /**
   * Remove a user connection from the tracking map
   */
  removeUserConnection(userId: string): void {
    this.userConnections.delete(userId);
    console.log(`User ${userId} disconnected`);
  }

  /**
   * Get socket ID for a specific user
   * @deprecated Use rooms instead
   */
  getUserSocketId(userId: string): string | undefined {
    return this.userConnections.get(userId);
  }

  /**
   * Check if a user is currently online
   * Checks across all nodes if Redis adapter is enabled
   */
  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.io) return false;
    try {
      const sockets = await this.io.in(userId).fetchSockets();
      return sockets.length > 0;
    } catch (error) {
      console.error(`Error checking online status for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Emit an event to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.error('Socket server not initialized');
      return;
    }

    // Emit to the user's room (works across multiple nodes with Redis adapter)
    this.io.to(userId).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit an event to all friends of a user
   */
  async emitToFriends(userId: string, event: string, data: any): Promise<void> {
    if (!this.io) {
      console.error('Socket server not initialized');
      return;
    }

    try {
      // Get user's friends list from database
      const user = await User.findById(userId).select('friends');
      
      if (!user || !user.friends || user.friends.length === 0) {
        console.log(`User ${userId} has no friends to notify`);
        return;
      }

      // Emit to each friend's room
      let notifiedCount = 0;
      for (const friendId of user.friends) {
        const friendIdString = friendId.toString();
        this.io.to(friendIdString).emit(event, data);
        notifiedCount++;
      }

      console.log(`Emitted ${event} to ${notifiedCount} friends of user ${userId}`);
    } catch (error) {
      console.error('Error emitting to friends:', error);
    }
  }

  /**
   * Get all active user IDs
   * Note: This only returns users connected to THIS node currently
   */
  getActiveUserIds(): string[] {
    return Array.from(this.userConnections.keys());
  }

  /**
   * Get total number of active connections
   */
  getActiveConnectionsCount(): number {
    return this.userConnections.size;
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Export the singleton instance and legacy functions for backwards compatibility
export const initializeSocket = (server: HttpServer): Server => 
  socketService.initializeSocket(server);

export const getSocket = (): Server => 
  socketService.getIO();

export { socketService };

