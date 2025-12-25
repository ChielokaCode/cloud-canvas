// import { createClient, RedisClientType } from 'redis';

// const redisHost = process.env.AZURE_REDIS_HOST || '';
// const redisKey = process.env.AZURE_REDIS_KEY || '';

// let redisClient: RedisClientType | null = null;

// const CACHE_VERSIONS = {
//   photos: 'photos:version',
// };

// export const getRedisClient = async (): Promise<RedisClientType> => {
//   if (!redisClient) {
//     redisClient = createClient({
//       url: `rediss://${redisHost}:6380`,
//       password: redisKey,
      
//       socket: {
//         connectTimeout: 10000, // 10 seconds
//         reconnectStrategy: retries => Math.min(retries * 50, 500),
//   },
//     });
    
//     redisClient.on('error', (err) => console.error('Redis Client Error', err));
//     await redisClient.connect();
//   }
//   return redisClient;
// };

// // Cache helpers
// // export const cacheGet = async <T>(key: string): Promise<T | null> => {
// //   const client = await getRedisClient();
// //   const data = await client.get(key);
// //   return data ? JSON.parse(data) : null;
// // };

// export const cacheGet = async <T>(key: string): Promise<T | null> => {
//   try {
//     const client = await getRedisClient();
//     const data = await client.get(key);
//     return data ? JSON.parse(data) : null;
//   } catch (err) {
//     console.warn('Redis unavailable, skipping cache');
//     return null; // fallback to DB
//   }
// };


// export const cacheSet = async <T>(
//   key: string,
//   value: T,
//   ttlSeconds: number = 300
// ): Promise<void> => {
//   const client = await getRedisClient();
//   await client.setEx(key, ttlSeconds, JSON.stringify(value));
// };

// export const cacheDelete = async (key: string): Promise<void> => {
//   const client = await getRedisClient();
//   await client.del(key);
// };

// export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
//   const client = await getRedisClient();
//   const keys = await client.keys(pattern);
//   if (keys.length > 0) {
//     await client.del(keys);
//   }
// };

// export const getPhotosCacheVersion = async (): Promise<number> => {
//   const client = await getRedisClient();
//   const version = await client.get(CACHE_VERSIONS.photos);
//   return version ? parseInt(version, 10) : 1;
// };

// export const bumpPhotosCacheVersion = async (): Promise<void> => {
//   const client = await getRedisClient();
//   await client.incr(CACHE_VERSIONS.photos);
// };



// export const CACHE_KEYS = {
//   photo: (id: string) => `photo:${id}`,
//   photos: (version: number, page: number, limit: number) =>
//     `photos:v${version}:page:${page}:limit:${limit}`,
// };


// // Cache key generators
// // export const CACHE_KEYS = {
// //   photo: (id: string) => `photo:${id}`,
// //   photos: (page: number) => `photos:page:${page}`,
// //   userPhotos: (userId: string) => `user:${userId}:photos`,
// //   photoLikes: (photoId: string) => `photo:${photoId}:likes`,
// //   photoComments: (photoId: string) => `photo:${photoId}:comments`,
// // } as const;




import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisReady = false;

const CACHE_VERSIONS = {
  photos: 'photos:version',
};

// Lazy read env
const getConfig = () => {
  const host = process.env.AZURE_REDIS_HOST;
  const key = process.env.AZURE_REDIS_KEY;

  if (!host || !key) {
    throw new Error('Redis env vars missing');
  }
  return { host, key };
};

export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    const { host, key } = getConfig();

    redisClient = createClient({
      url: `rediss://${host}:6380`,
      password: key,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: retries => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', err => {
      console.error('Redis Client Error', err);
      redisReady = false;
    });
  }

  if (!redisReady) {
    try {
      await redisClient.connect();
      redisReady = true;
    } catch (err) {
      console.warn('Redis unavailable, using fallback');
      redisReady = false;
    }
  }

  return redisClient;
};

// Cache helpers
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null; // fallback
  }
};

export const cacheSet = async <T>(key: string, value: T, ttlSeconds = 300) => {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // fail silently
  }
};

export const cacheDelete = async (key: string) => {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch {
    // fail silently
  }
};

export const getPhotosCacheVersion = async (): Promise<number> => {
  try {
    const client = await getRedisClient();
    const version = await client.get(CACHE_VERSIONS.photos);
    if (!version) {
      await client.set(CACHE_VERSIONS.photos, '1');
      return 1;
    }
    return parseInt(version, 10);
  } catch {
    return 1;
  }
};

export const bumpPhotosCacheVersion = async () => {
  try {
    const client = await getRedisClient();
    await client.incr(CACHE_VERSIONS.photos);
  } catch {
    // fail silently
  }
};

// Versioned keys
export const CACHE_KEYS = {
  photo: (id: string) => `photo:${id}`,
  photos: (version: number, page: number, limit: number) =>
    `photos:v${version}:page:${page}:limit:${limit}`,
};
