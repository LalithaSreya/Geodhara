import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../config/redis.js';
import { AppError } from './errorHandler.js';

interface RateLimitOptions {
  windowSec: number;
  maxRequests: number;
  keyPrefix?: string;
  skipInTest?: boolean;
}

const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

export function rateLimiter(options: RateLimitOptions) {
  const { windowSec, maxRequests, keyPrefix = 'rl' } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // In test environment, allow opt-in skipping unless specifically testing rate limiter
    if (process.env.NODE_ENV === 'test' && options.skipInTest !== false) {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    try {
      // Check in memory / redis
      let currentCount = 0;
      let ttl = windowSec;

      const mem = memoryCounters.get(key);
      if (mem && mem.expiresAt > now) {
        currentCount = mem.count + 1;
        ttl = Math.ceil((mem.expiresAt - now) / 1000);
        memoryCounters.set(key, { count: currentCount, expiresAt: mem.expiresAt });
      } else {
        currentCount = 1;
        memoryCounters.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
      }

      if (currentCount > maxRequests) {
        throw new AppError(
          429,
          'TOO_MANY_REQUESTS',
          `Too many requests. Rate limit of ${maxRequests} requests per ${windowSec}s exceeded.`,
          {
            retryAfterSeconds: ttl,
            limit: maxRequests,
            windowSeconds: windowSec,
          }
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
