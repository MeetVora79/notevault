import { Worker } from "bullmq";
import { getRedis } from "../config/redis.js";
import { getNotesCollection } from "../config/chroma.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import { getGeminiModel, generateWithRetry } from "../config/gemini.js";
import Note from "../models/Note.js";

const handleEmbedding = async (job) => {
  const { noteId, content, title } = job.data;
  console.log(`🔄 Embedding note ${noteId}...`);

  await Note.findByIdAndUpdate(noteId, { embeddingStatus: "pending" });

  const textToEmbed = title ? `${title}\n\n${content}` : content;
  const embedding = await generateEmbedding(textToEmbed);

  const collection = await getNotesCollection();
  await collection.upsert({
    ids: [noteId],
    embeddings: [embedding],
    metadatas: [{ noteId, updatedAt: new Date().toISOString() }],
    documents: [textToEmbed],
  });

  await Note.findByIdAndUpdate(noteId, {
    embeddingStatus: "done",
    chromaId: noteId,
  });

  console.log(`✅ Note ${noteId} embedded successfully`);
};

const handleReminderExtraction = async (job) => {
  const { noteId, content, title } = job.data;
  console.log(`🔔 Extracting reminders from note ${noteId}...`);

  const textToAnalyze = title ? `${title}\n\n${content}` : content;

  const model = getGeminiModel();

  const prompt = `Analyze the following note and extract any reminders, deadlines, meetings, or time-sensitive tasks.

Rules:
- Only extract items that have a clear time/date reference OR a strong implied urgency
- Return valid JSON only — no markdown, no backticks, no explanation
- If no reminders found, return: {"reminders": []}
- Each reminder must have: "text" (short 2-6 word description) and "datetime" (exact text from note, or null if vague)

Examples of what to extract:
- "Meet John on Friday" → text: "Meet John", datetime: "Friday"
- "Submit report by 5th" → text: "Submit report", datetime: "5th"
- "Don't forget dentist appointment tomorrow at 3pm" → text: "Dentist appointment", datetime: "tomorrow at 3pm"
- "Call mom" → skip (no time reference)
- "Buy groceries" → skip (no urgency or time)

Note content:
${textToAnalyze}

Return JSON:`;

  try {
    const result = await generateWithRetry(model, prompt);
    let raw = result.response.text().trim();
    console.log("🤖 Gemini response:", raw);

    // Strip markdown code blocks if Gemini wraps response
    raw = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);
    const reminders = parsed.reminders || [];

    if (reminders.length > 0) {
      // Only add genuinely new reminders — don't duplicate ones already stored
      const note = await Note.findById(noteId).select("reminders");
      const existingTexts = (note?.reminders || []).map((r) =>
        r.text.toLowerCase(),
      );

      const newReminders = reminders
        .filter((r) => r.text && !existingTexts.includes(r.text.toLowerCase()))
        .map((r) => ({
          text: r.text,
          datetime: r.datetime || null,
          acknowledged: false,
          dismissed: false,
          extractedAt: new Date(),
        }));

      if (newReminders.length > 0) {
        await Note.findByIdAndUpdate(noteId, {
          $push: { reminders: { $each: newReminders } },
        });
        console.log(
          `✅ ${newReminders.length} reminder(s) extracted for note ${noteId}`,
        );
      } else {
        console.log(`ℹ️ No new reminders for note ${noteId}`);
      }
    } else {
      console.log(`ℹ️ No reminders found in note ${noteId}`);
    }
  } catch (err) {
    console.warn(`⚠️ Reminder extraction failed for ${noteId}:`, err.message);
    throw err;
    // Silently fail — reminders are non-critical, note is unaffected
  }
};

export const startNoteWorker = () => {
  const worker = new Worker(
    "note-embeddings",
    async (job) => {
      console.log(`Processing job: ${job.id}, name: "${job.name}"`);

      if (job.name === "embed-note") {
        await handleEmbedding(job);
      } else if (job.name === "extract-reminders") {
        await handleReminderExtraction(job);
      } else {
        console.warn(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection: getRedis(),
      concurrency: 3,
    },
  );

  worker.on("active", (job) => {
    console.log(`⚡ Worker picked up job: ${job.id} (${job.name})`);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`❌ Job failed: ${job.id} — ${err.message}`);
    if (job.name === "embed-note") {
      await Note.findByIdAndUpdate(job.data.noteId, {
        embeddingStatus: "failed",
      });
    }
  });

  console.log("🚀 Note embedding worker started");
  return worker;
};
