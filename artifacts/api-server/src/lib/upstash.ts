import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a no-op fallback if Redis is not configured
const noopRedis = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
  keys: async () => [] as string[],
} as unknown as Redis;

export const upstashRedis = url && token
  ? new Redis({ url, token })
  : noopRedis;

if (!url || !token) {
  console.warn("[Cache] UPSTASH_REDIS_REST_URL or TOKEN not set. Redis cache disabled.");
}

export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await upstashRedis.keys(pattern);
    if (keys.length > 0) {
      await upstashRedis.del(...keys);
    }
  } catch (error) {
    console.error("Upstash Redis Invalidate Error:", error);
  }
};

