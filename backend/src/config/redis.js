import { Redis } from "ioredis";

let redis = null;

export const getRedis = () => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null, // required by BullMQ
    });

    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (err) => console.error("❌ Redis error:", err.message));
  }
  return redis;
};