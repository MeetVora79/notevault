import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import { startNoteWorker } from "./src/queues/noteWorker.js";
import { getRedis } from "./src/config/redis.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });

  // Wait for Redis to be ready before starting worker
  const redis = getRedis();
  try {
    await new Promise((resolve, reject) => {
      if (redis.status === "ready") return resolve();
      redis.once("ready", resolve);
      redis.once("error", reject);
      // Add timeout to prevent hanging indefinitely
      setTimeout(() => reject(new Error("Redis connection timeout after 10s")), 10000);
    });

    startNoteWorker();
  } catch (err) {
    console.error("❌ Redis connection failed, background worker not started:", err.message);
    console.error("⚠️ Note: Embedding and reminder extraction will not work until Redis is available");
  }
};

start();

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});
