import dotenv from "dotenv";
dotenv.config();

import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL, { tls: {} });

const run = async () => {
  try {
    await redis.flushdb();
    console.log("✅ Redis flushed");
  } catch (err) {
    console.error("❌ Failed:", err.message);
  } finally {
    redis.quit();
  }
};

run();