import { type Request, type Response, type NextFunction } from "express";
import { logger } from "./logger";
import { upstashRedis } from "./upstash";

export const cacheMiddleware = (durationInSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cachedData = await upstashRedis.get(key);
      if (cachedData) {
        return res.json(typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any): any => {
        upstashRedis.set(key, JSON.stringify(body), { ex: durationInSeconds }).catch((err) => {
          logger.error("Upstash Redis Set Error: " + err.message);
        });
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error("Upstash Middleware Error: " + (err as Error).message);
      next();
    }
  };
};
