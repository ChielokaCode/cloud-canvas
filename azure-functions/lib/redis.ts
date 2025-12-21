import { createClient, RedisClientType } from 'redis';

const redisHost = process.env.AZURE_REDIS_HOST || '';
const redisKey = process.env.AZURE_REDIS_KEY || '';
const redisPort = parseInt(process.env.AZURE_REDIS_PORT || '6380');

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      url: `rediss://${redisHost}:${redisPort}`,
      password: redisKey,
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
};

// Cache helpers
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const client = await getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

export const cacheSet = async <T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> => {
  const client = await getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
};

export const cacheDelete = async (key: string): Promise<void> => {
  const client = await getRedisClient();
  await client.del(key);
};

export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  const client = await getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
};

// Cache key generators
export const CACHE_KEYS = {
  photo: (id: string) => `photo:${id}`,
  photos: (page: number) => `photos:page:${page}`,
  userPhotos: (userId: string) => `user:${userId}:photos`,
  photoLikes: (photoId: string) => `photo:${photoId}:likes`,
  photoComments: (photoId: string) => `photo:${photoId}:comments`,
} as const;