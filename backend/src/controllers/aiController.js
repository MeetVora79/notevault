import asyncHandler from "express-async-handler";
import { getGeminiModel } from "../config/gemini.js";
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
