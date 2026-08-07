import { Worker } from "bullmq";
import { getRedis } from "../config/redis.js";
import { getNotesCollection } from "../config/chroma.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import Note from "../models/Note.js";

export const startNoteWorker = () => {
  const worker = new Worker(
    "note-embeddings",
    async (job) => {
      const { noteId, content, title } = job.data;

      console.log(`🔄 Embedding note ${noteId}...`);

      // Mark as pending in MongoDB
      await Note.findByIdAndUpdate(noteId, { embeddingStatus: "pending" });

      // Generate embedding from title + content combined
      const textToEmbed = title ? `${title}\n\n${content}` : content;
      const embedding = await generateEmbedding(textToEmbed);

      // Store in ChromaDB
      const collection = await getNotesCollection();

      await collection.upsert({
        ids: [noteId],
        embeddings: [embedding],
        metadatas: [{ noteId, updatedAt: new Date().toISOString() }],
        documents: [textToEmbed],
      });

      // Mark as done in MongoDB
      await Note.findByIdAndUpdate(noteId, {
        embeddingStatus: "done",
        chromaId: noteId,
      });

      console.log(`✅ Note ${noteId} embedded successfully`);
    },
    {
      connection: getRedis(),
      concurrency: 3, // process max 3 notes at once
    },
  );

  worker.on("active", (job) => {
    console.log(`⚡ Worker picked up job: ${job.id}`);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.log(`❌ Job failed: ${job.id} — ${err.message}`);
  });

  worker.on("failed", async (job, err) => {
    console.error(
      `❌ Embedding job failed for note ${job.data.noteId}:`,
      err.message,
    );
    await Note.findByIdAndUpdate(job.data.noteId, {
      embeddingStatus: "failed",
    });
  });

  console.log("🚀 Note embedding worker started");
  return worker;
};
