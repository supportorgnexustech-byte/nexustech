import { Redis } from "@upstash/redis";

export const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
