"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_KEYS = exports.bumpPhotosCacheVersion = exports.getPhotosCacheVersion = exports.cacheInvalidatePattern = exports.cacheDelete = exports.cacheSet = exports.cacheGet = exports.getRedisClient = void 0;
const redis_1 = require("redis");
const redisHost = process.env.AZURE_REDIS_HOST || '';
const redisKey = process.env.AZURE_REDIS_KEY || '';
let redisClient = null;
const CACHE_VERSIONS = {
    photos: 'photos:version',
};
const getRedisClient = async () => {
    if (!redisClient) {
        redisClient = (0, redis_1.createClient)({
            url: `rediss://${redisHost}:6380`,
            password: redisKey,
            socket: {
                connectTimeout: 10000, // 10 seconds
                reconnectStrategy: retries => Math.min(retries * 50, 500),
            },
        });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
// Cache helpers
// export const cacheGet = async <T>(key: string): Promise<T | null> => {
//   const client = await getRedisClient();
//   const data = await client.get(key);
//   return data ? JSON.parse(data) : null;
// };
const cacheGet = async (key) => {
    try {
        const client = await (0, exports.getRedisClient)();
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (err) {
        console.warn('Redis unavailable, skipping cache');
        return null; // fallback to DB
    }
};
exports.cacheGet = cacheGet;
const cacheSet = async (key, value, ttlSeconds = 300) => {
    const client = await (0, exports.getRedisClient)();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
};
exports.cacheSet = cacheSet;
const cacheDelete = async (key) => {
    const client = await (0, exports.getRedisClient)();
    await client.del(key);
};
exports.cacheDelete = cacheDelete;
const cacheInvalidatePattern = async (pattern) => {
    const client = await (0, exports.getRedisClient)();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
        await client.del(keys);
    }
};
exports.cacheInvalidatePattern = cacheInvalidatePattern;
const getPhotosCacheVersion = async () => {
    const client = await (0, exports.getRedisClient)();
    const version = await client.get(CACHE_VERSIONS.photos);
    return version ? parseInt(version, 10) : 1;
};
exports.getPhotosCacheVersion = getPhotosCacheVersion;
const bumpPhotosCacheVersion = async () => {
    const client = await (0, exports.getRedisClient)();
    await client.incr(CACHE_VERSIONS.photos);
};
exports.bumpPhotosCacheVersion = bumpPhotosCacheVersion;
exports.CACHE_KEYS = {
    photo: (id) => `photo:${id}`,
    photos: (version, page, limit) => `photos:v${version}:page:${page}:limit:${limit}`,
};
// Cache key generators
// export const CACHE_KEYS = {
//   photo: (id: string) => `photo:${id}`,
//   photos: (page: number) => `photos:page:${page}`,
//   userPhotos: (userId: string) => `user:${userId}:photos`,
//   photoLikes: (photoId: string) => `photo:${photoId}:likes`,
//   photoComments: (photoId: string) => `photo:${photoId}:comments`,
// } as const;
//# sourceMappingURL=redis.js.map