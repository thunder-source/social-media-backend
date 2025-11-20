import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { registerSocketHandlers } from '../socket/socketHandlers';
import { User } from '../models/User';

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
   */
  addUserConnection(userId: string, socketId: string): void {
    this.userConnections.set(userId, socketId);
    console.log(`User ${userId} connected with socket ${socketId}`);
    console.log(`Active connections: ${this.userConnections.size}`);
  }

  /**
   * Remove a user connection from the tracking map
   */
  removeUserConnection(userId: string): void {
    this.userConnections.delete(userId);
    console.log(`User ${userId} disconnected`);
    console.log(`Active connections: ${this.userConnections.size}`);
  }

  /**
   * Get socket ID for a specific user
   */
  getUserSocketId(userId: string): string | undefined {
    return this.userConnections.get(userId);
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  /**
   * Emit an event to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.error('Socket server not initialized');
      return;
    }

    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`Emitted ${event} to user ${userId}`);
    } else {
      console.log(`User ${userId} is not online, cannot emit ${event}`);
    }
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

      // Emit to each online friend
      let notifiedCount = 0;
      for (const friendId of user.friends) {
        const friendIdString = friendId.toString();
        const friendSocketId = this.getUserSocketId(friendIdString);
        
        if (friendSocketId) {
          this.io.to(friendSocketId).emit(event, data);
          notifiedCount++;
        }
      }

      console.log(`Emitted ${event} to ${notifiedCount} online friends of user ${userId}`);
    } catch (error) {
      console.error('Error emitting to friends:', error);
    }
  }

  /**
   * Get all active user IDs
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

