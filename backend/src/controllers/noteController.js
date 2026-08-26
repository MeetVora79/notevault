import asyncHandler from "express-async-handler";
import Note from "../models/Note.js";
import { addEmbeddingJob, addReminderJob } from "../queues/noteQueue.js";
import { getNotesCollection } from "../config/chroma.js";
import { getGeminiModel } from "../config/gemini.js";
import { generateWithRetry } from "../config/gemini.js";

// @desc   Create a new note
// @route  POST /api/notes
// @access Private
export const createNote = asyncHandler(async (req, res) => {
  const { title, content, labels } = req.body;

  const note = await Note.create({
    user: req.user._id,
    title: title || "",
    content: content || "",
    labels: labels || [],
  });

  if (note.content?.trim()) {
    await addEmbeddingJob(note._id.toString(), note.content, note.title);
    await addReminderJob(note._id.toString(), note.content, note.title);
  }

  res.status(201).json({ success: true, note });
});

// @desc   Get all notes for logged-in user (with filters)
// @route  GET /api/notes?folder=&tag=&archived=&trashed=&search=
// @access Private
import { getRedis } from "../config/redis.js";

const client = getRedis();

export const getNotes = asyncHandler(async (req, res) => {
  const { label, archived, trashed, search } = req.query;

  const query = {
    user: req.user._id,
    isArchived: archived === "true",
    isTrashed: trashed === "true",
  };

  if (label) query.labels = label;

  if (search) {
    query.$text = { $search: search };
  }

  const cacheKey = `notes:${req.user._id}:${label || ""}:${archived || ""}:${trashed || ""}:${search || ""}`;

  // 1. Check Redis
  const cacheValue = await client.get(cacheKey);

  if (cacheValue) {
    const notes = JSON.parse(cacheValue);

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  }

  // 2. If Redis doesn't have it → MongoDB
  const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

  // 3. Store MongoDB result in Redis
  await client.set(cacheKey, JSON.stringify(notes), "EX", 180);

  // 4. Same response structure as before
  return res.status(200).json({
    success: true,
    count: notes.length,
    notes,
  });
});

// @desc   Get single note by id
// @route  GET /api/notes/:id
// @access Private
export const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }

  res.status(200).json({ success: true, note });
});

// @desc   Update a note
// @route  PUT /api/notes/:id
// @access Private
export const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }

  const { title, content, labels } = req.body;

  const contentChanged =
    content !== undefined && content.trim() !== note.content;

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (labels !== undefined) note.labels = labels;

  if (contentChanged) {
    note.embeddingStatus = "pending";
    note.summaryStatus = note.summary ? "pending" : "none";
  }

  await note.save();

  // Re-embed if content changed
  if (contentChanged && note.content?.trim()) {
    console.log(
      "📝 Queuing embedding job for updated note:",
      note._id.toString(),
    );
    await addEmbeddingJob(note._id.toString(), note.content, note.title);
    await addReminderJob(note._id.toString(), note.content, note.title);
  }

  res.status(200).json({ success: true, note });
});

// @desc   Toggle pin
// @route  PATCH /api/notes/:id/pin
// @access Private
export const togglePin = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }
  note.isPinned = !note.isPinned;
  await note.save();
  res.status(200).json({ success: true, note });
});

// @desc   Toggle archive
// @route  PATCH /api/notes/:id/archive
// @access Private
export const toggleArchive = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }
  note.isArchived = !note.isArchived;
  await note.save();
  res.status(200).json({ success: true, note });
});

// @desc   Move note to trash (soft delete)
// @route  DELETE /api/notes/:id
// @access Private
export const trashNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }
  note.isTrashed = true;
  note.isPinned = false;
  await note.save();
  res.status(200).json({ success: true, message: "Note moved to trash" });
});

// @desc   Restore note from trash
// @route  PATCH /api/notes/:id/restore
// @access Private
export const restoreNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }
  note.isTrashed = false;
  await note.save();
  res.status(200).json({ success: true, note });
});

// @desc   Permanently delete a note (must be trashed first)
// @route  DELETE /api/notes/:id/permanent
// @access Private
export const deleteNotePermanently = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }
  if (!note.isTrashed) {
    res.status(400);
    throw new Error("Note must be trashed before permanent deletion");
  }
  await note.deleteOne();
  res.status(200).json({ success: true, message: "Note permanently deleted" });
});

// @desc   Duplicate a note
// @route  POST /api/notes/:id/copy
// @access Private
export const copyNote = asyncHandler(async (req, res) => {
  const original = await Note.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!original) {
    res.status(404);
    throw new Error("Note not found");
  }

  const copy = await Note.create({
    user: req.user._id,
    title: original.title ? `${original.title} (copy)` : "",
    content: original.content,
    labels: original.labels,
  });

  res.status(201).json({ success: true, note: copy });
});

// @desc   Get semantically related notes for a given note
// @route  GET /api/notes/:id/related
// @access Private
export const getRelatedNotes = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("Note not found");
  }

  // No embedding yet (e.g. brand new note, background job hasn't run) — nothing to relate
  if (note.embeddingStatus !== "done") {
    return res.status(200).json({ success: true, notes: [] });
  }

  try {
    const collection = await getNotesCollection();

    // Fetch this note's own stored embedding from ChromaDB, then find its neighbors
    const stored = await collection.get({
      ids: [note._id.toString()],
      include: ["embeddings"],
    });

    const noteEmbedding = stored.embeddings?.[0];
    if (!noteEmbedding) {
      return res.status(200).json({ success: true, notes: [] });
    }

    const results = await collection.query({
      queryEmbeddings: [noteEmbedding],
      nResults: 6, // fetch a few extra since we filter out itself + trashed/archived
      include: ["distances"],
    });

    const candidateIds = results.ids[0] || [];
    const distances = results.distances[0] || [];

    const THRESHOLD = 0.7;
    const relatedIds = candidateIds
      .filter((id, i) => id !== note._id.toString() && distances[i] < THRESHOLD)
      .slice(0, 4);

    if (!relatedIds.length) {
      return res.status(200).json({ success: true, notes: [] });
    }

    const relatedNotes = await Note.find({
      _id: { $in: relatedIds },
      user: req.user._id,
      isTrashed: false,
      isArchived: false,
    }).select("title content");

    // Preserve similarity ranking
    const ranked = relatedIds
      .map((id) => relatedNotes.find((n) => n._id.toString() === id))
      .filter(Boolean);

    res.status(200).json({ success: true, notes: ranked });
  } catch (err) {
    console.warn("Related notes warning:", err.message);
    res.status(200).json({ success: true, notes: [] });
  }
});

// @desc   Merge multiple notes into one new note
// @route  POST /api/notes/merge
// @access Private
export const mergeNotes = asyncHandler(async (req, res) => {
  const { noteIds } = req.body;

  if (!Array.isArray(noteIds) || noteIds.length < 2) {
    res.status(400);
    throw new Error("Select at least 2 notes to merge");
  }

  const notes = await Note.find({
    _id: { $in: noteIds },
    user: req.user._id,
    isTrashed: false,
  });

  if (notes.length < 2) {
    res.status(400);
    throw new Error("Could not find the selected notes");
  }

  // Preserve the order the user selected them in
  const ordered = noteIds
    .map((id) => notes.find((n) => n._id.toString() === id))
    .filter(Boolean);

  const mergedContent = ordered
    .map((n) => {
      const heading = n.title || "Untitled note";
      return `--- ${heading} ---\n${n.content}`;
    })
    .join("\n\n");

  const mergedLabels = [...new Set(ordered.flatMap((n) => n.labels || []))];

  // Auto-generate a title for the merged note
  let mergedTitle = "";
  let aiTitleGenerated = false;
  try {
    const model = getGeminiModel();
    const prompt = `You are a note-taking assistant. Generate a concise, specific title for the following note.

Rules:
- Maximum 8 words
- No quotes, punctuation at the end, or filler phrases like "Note about" or "A note on"
- Be direct and descriptive — capture the core topic
- Return ONLY the title, nothing else

Note content:
${mergedContent.slice(0, 3000)}`;

    const result = await generateWithRetry(model, prompt);
    mergedTitle = result.response.text().trim();
    aiTitleGenerated = true;
  } catch (err) {
    console.warn("Merge title generation failed, leaving blank:", err.message);
  }

  const mergedNote = await Note.create({
    user: req.user._id,
    title: mergedTitle,
    content: mergedContent,
    labels: mergedLabels,
    mergedFrom: noteIds, // flag so the editor knows to show "Organize with AI"
    aiTitleGenerated,
  });

  res.status(201).json({ success: true, note: mergedNote });
});

// @desc   Acknowledge a reminder
// @route  PATCH /api/notes/:id/reminders/:reminderId/acknowledge
// @access Private
export const acknowledgeReminder = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      "reminders._id": req.params.reminderId,
    },
    { $set: { "reminders.$.acknowledged": true } },
    { new: true },
  );

  if (!note) {
    res.status(404);
    throw new Error("Note or reminder not found");
  }

  res.status(200).json({ success: true, note });
});

// @desc   Unacknowledge a reminder (undo)
// @route  PATCH /api/notes/:id/reminders/:reminderId/unacknowledge
// @access Private
export const unacknowledgeReminder = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      "reminders._id": req.params.reminderId,
    },
    { $set: { "reminders.$.acknowledged": false } },
    { new: true },
  );

  if (!note) {
    res.status(404);
    throw new Error("Note or reminder not found");
  }

  res.status(200).json({ success: true, note });
});

// @desc   Remove a reminder permanently
// @route  DELETE /api/notes/:id/reminders/:reminderId
// @access Private
export const removeReminder = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $pull: { reminders: { _id: req.params.reminderId } } },
    { new: true },
  );

  if (!note) {
    res.status(404);
    throw new Error("Note or reminder not found");
  }

  res.status(200).json({ success: true, note });
});
