import { createClient, RedisClientType } from 'redis';
import pino from 'pino';

const logger = pino();

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    } as any);

    this.client.on('error', (err: any) => {
      logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Failed to get cache key ${key}: ${err}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, expirationSeconds: number = 3600): Promise<void> {
    try {
      await this.client.setEx(key, expirationSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error(`Failed to set cache key ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.error(`Failed to delete cache key ${key}: ${err}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }
}

export const cacheService = new CacheService();
