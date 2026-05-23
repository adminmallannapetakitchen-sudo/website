import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

/**
 * H4: lightweight Redis leader lock.
 *
 * `@Cron` fires on every instance. With the Redis Socket.IO adapter the API
 * scales horizontally, so without a lock N replicas would all run the
 * payment sweep / Sunday-special fan-out simultaneously (duplicate mass push
 * notifications, redundant work). `withLock` ensures exactly one instance
 * runs the critical section per tick.
 */
@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly logger = new Logger('RedisLock');
  private readonly client: Redis;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL missing');
    this.client = new Redis(url, { maxRetriesPerRequest: null });
  }

  /**
   * Run `fn` only if this instance wins the named lock. Returns true if it ran.
   * The lock auto-expires after `ttlMs` so a crashed holder never deadlocks it.
   */
  async withLock(key: string, ttlMs: number, fn: () => Promise<void>): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const token = randomBytes(16).toString('hex');
    const acquired = await this.client.set(lockKey, token, 'PX', ttlMs, 'NX');
    if (acquired !== 'OK') {
      this.logger.debug(`Lock ${key} held by another instance — skipping`);
      return false;
    }
    try {
      await fn();
      return true;
    } finally {
      // Release only if we still own it (compare-and-delete).
      await this.client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        token,
      );
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
