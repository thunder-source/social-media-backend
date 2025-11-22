import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import os from 'os';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  server: {
    nodeVersion: string;
    processId: number;
    platform: string;
    architecture: string;
  };
  memory: {
    total: string;
    free: string;
    used: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
    rss: string;
  };
  cpu: {
    model: string;
    cores: number;
    loadAverage: number[];
  };
  database: {
    status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'uninitialized';
    host?: string;
    name?: string;
  };
}

class HealthController {
  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  healthCheck = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const cpus = os.cpus();

      // Check database connection status
      const dbState = mongoose.connection.readyState;
      const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized',
      } as const;

      const dbStatus = dbStatusMap[dbState as keyof typeof dbStatusMap] || 'uninitialized';

      const healthData: HealthCheckResponse = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        server: {
          nodeVersion: process.version,
          processId: process.pid,
          platform: os.platform(),
          architecture: os.arch(),
        },
        memory: {
          total: this.formatBytes(totalMemory),
          free: this.formatBytes(freeMemory),
          used: this.formatBytes(usedMemory),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          external: this.formatBytes(memoryUsage.external),
          rss: this.formatBytes(memoryUsage.rss),
        },
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          loadAverage: os.loadavg(),
        },
        database: {
          status: dbStatus,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
      };

      // Return 503 if database is not connected
      const statusCode = dbState === 1 ? 200 : 503;
      res.status(statusCode).json(healthData);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();
