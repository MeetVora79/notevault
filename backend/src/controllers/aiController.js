import asyncHandler from "express-async-handler";
import { getGeminiModel, generateWithRetry } from "../config/gemini.js";
import { getNotesCollection } from "../config/chroma.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import Note from "../models/Note.js";

// @desc   Generate a title for a note using Gemini
// @route  POST /api/ai/generate-title
// @access Private
export const generateTitle = asyncHandler(async (req, res) => {
  const { content, noteId } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Note content is required to generate a title");
  }
  const model = getGeminiModel();

  const prompt = `You are a note-taking assistant. Generate a concise, specific title for the following note.

Rules:
- Maximum 8 words
- No quotes, punctuation at the end, or filler phrases like "Note about" or "A note on"
- Be direct and descriptive — capture the core topic
- Return ONLY the title, nothing else

Note content:
${content.trim()}`;
  const result = await model.generateContent(prompt);
  const title = result.response.text().trim();

  // If a noteId was provided, update the note in the DB and flag it as AI-generated
  if (noteId) {
    await Note.findOneAndUpdate(
      { _id: noteId, user: req.user._id },
      { title, aiTitleGenerated: true },
    );
  }
  res.status(200).json({ success: true, title });
});

// @desc   Summarize a note using Gemini
// @route  POST /api/ai/summarize
// @access Private
export const summarizeNote = asyncHandler(async (req, res) => {
  const { content, noteId } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Note content is required to summarize");
  }

  const model = getGeminiModel();

  const prompt = `You are a note-taking assistant. Write a concise summary of the following note.

Rules:
- 1-3 sentences maximum
- Capture the key points only
- Write in plain, clear language
- Do not start with "This note" or "The note" — be direct
- Return ONLY the summary, nothing else

Note content:
${content.trim()}`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text().trim();

  // Save summary to the note if noteId provided
  if (noteId) {
    await Note.findOneAndUpdate(
      { _id: noteId, user: req.user._id },
      { summary, summaryStatus: "done" },
    );
  }

  res.status(200).json({ success: true, summary });
});

// @desc   RAG Chat — answer questions using note context
// @route  POST /api/ai/chat
// @access Private
export const chatWithNotes = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  // Step 1 — embed the user's question
  const queryEmbedding = await generateEmbedding(message);

  // Step 2 — find most relevant notes from ChromaDB
  const collection = await getNotesCollection();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
  });

  const noteIds = results.ids[0] || [];

  // Step 3 — fetch full note content from MongoDB (security: filter by user)
  const relevantNotes = await Note.find({
    _id: { $in: noteIds },
    user: req.user._id,
    isTrashed: false,
    isArchived: false,
  });

  if (!relevantNotes.length) {
    return res.status(200).json({
      success: true,
      answer:
        "I couldn't find any relevant notes to answer your question. Try adding some notes first.",
      sources: [],
    });
  }

  // Step 4 — build context from relevant notes
  const context = relevantNotes
    .map((note, i) => {
      const title = note.title || "Untitled note";
      return `[Note ${i + 1}] ${title}\n${note.content}`;
    })
    .join("\n\n---\n\n");

  // Step 5 — build conversation history for multi-turn chat
  const historyText = history
    .slice(-6) // last 3 exchanges
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  // Step 6 — generate answer with Gemini
  const model = getGeminiModel();

  const prompt = `You are a helpful AI assistant that answers questions based on the user's personal notes.

CONTEXT — relevant notes from the user's knowledge base:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}

INSTRUCTIONS:
- Answer the user's question using ONLY information from the notes above
- If the notes don't contain enough information, say so clearly
- Be concise and direct — 2-4 sentences unless more detail is needed
- Never make up information not present in the notes
- Reference specific notes naturally (e.g. "According to your trip planning note...")

User question: ${message}

Answer:`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text().trim();

  // Step 7 — return answer + source note references
  const sources = relevantNotes.map((note) => ({
    id: note._id,
    title: note.title || "Untitled note",
  }));

  res.status(200).json({ success: true, answer, sources });
});

// @desc   Reorganize merged note content using Gemini
// @route  POST /api/ai/organize
// @access Private
export const organizeNote = asyncHandler(async (req, res) => {
  const { content, noteId } = req.body;

  if (!content?.trim()) {
    res.status(400);
    throw new Error("Content is required");
  }

  const model = getGeminiModel();

  const prompt = `You are organizing a note that was merged from multiple separate notes (marked with "--- Heading ---" sections).

Rules:
- Reorganize the content by topic/theme instead of by original section
- Merge overlapping or duplicate points
- Do NOT omit, summarize away, or lose any fact, detail, or piece of information — every distinct point from every section must appear somewhere in the output
- Do NOT invent new information
- Remove the "--- Heading ---" markers — write as one continuous, well-structured note using natural paragraph breaks or simple headings if helpful
- Return ONLY the reorganized note content, nothing else

Content to reorganize:
${content}`;

  try {
    const result = await generateWithRetry(model, prompt);
    const organized = result.response.text().trim();

    if (noteId) {
      await Note.findOneAndUpdate(
        { _id: noteId, user: req.user._id },
        { content: organized, embeddingStatus: "pending" },
      );
    }

    res.status(200).json({ success: true, content: organized });
  } catch (err) {
    console.warn("Organize note failed:", err.message);

    const isOverloaded =
      err.message?.includes("503") || err.message?.includes("overloaded");

    res.status(503);
    throw new Error(
      isOverloaded
        ? "AI is temporarily overloaded — please try again in a moment. Your note content is unchanged."
        : "Could not organize note right now. Your note content is unchanged.",
    );
  }
});
