import { Queue } from "bullmq";
import { getRedis } from "../config/redis.js";

let noteQueue = null;

export const getNoteQueue = () => {
  if (!noteQueue) {
    noteQueue = new Queue("note-embeddings", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return noteQueue;
};

export const addEmbeddingJob = async (noteId, content, title = "") => {
  const queue = getNoteQueue();
  const job = await queue.add("embed-note", { noteId, content, title });
  console.log(`📬 Job added to queue: ${job.id}`);
};
