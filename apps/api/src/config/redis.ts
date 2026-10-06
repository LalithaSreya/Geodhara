import { createClient } from 'redis';
import { env } from './env.js';

type RedisClientType = ReturnType<typeof createClient>;

let client: RedisClientType | null = null;
const memoryStore = new Map<string, { value: string; expiry?: number }>();

export async function initRedis(): Promise<void> {
  try {
    client = createClient({ url: env.REDIS_URL });
    client.on('error', (err) => {
      // In local dev/test or when redis is starting, fallback safely
      // console.warn('Redis client error, falling back to in-memory store:', err.message);
    });
    await client.connect();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.warn('Redis unavailable, using in-memory fallback cache');
    client = null;
  }
}

export async function getCache(key: string): Promise<string | null> {
  if (client?.isReady) {
    try {
      return await client.get(key);
    } catch {
      // Fallback
    }
  }
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiry && item.expiry < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (client?.isReady) {
    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
      return;
    } catch {
      // Fallback
    }
  }
  memoryStore.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

export async function deleteCache(key: string): Promise<void> {
  if (client?.isReady) {
    try {
      await client.del(key);
      return;
    } catch {
      // Fallback
    }
  }
  memoryStore.delete(key);
}
