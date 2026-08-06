import asyncHandler from "express-async-handler";
import Note from "../models/Note.js";

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

  res.status(201).json({ success: true, note });
});

// @desc   Get all notes for logged-in user (with filters)
// @route  GET /api/notes?folder=&tag=&archived=&trashed=&search=
// @access Private
export const getNotes = asyncHandler(async (req, res) => {
  const { label, archived, trashed, search } = req.query;

  const query = { user: req.user._id };

  query.isArchived = archived === "true";
  query.isTrashed = trashed === "true";

  if (label) query.labels = label;
  if (search) query.$text = { $search: search };

  const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

  res.status(200).json({ success: true, count: notes.length, notes });
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

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (labels !== undefined) note.labels = labels;

  // If content changed significantly, mark embedding as stale (used in Phase 8)
  if (content !== undefined) {
    note.embeddingStatus = "pending";
    note.summaryStatus = note.summary ? "pending" : "none";
  }

  await note.save();

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
