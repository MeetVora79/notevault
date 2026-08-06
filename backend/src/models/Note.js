import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
    content: {
      type: String,
      default: "",
    },
    // AI fields (populated in later phases, kept here now so schema is stable)
    aiTitleGenerated: { type: Boolean, default: false },
    summary: { type: String, default: null },
    summaryStatus: {
      type: String,
      enum: ["none", "pending", "done", "failed"],
      default: "none",
    },
    embeddingStatus: {
      type: String,
      enum: ["none", "pending", "done", "failed"],
      default: "none",
    },
    chromaId: { type: String, default: null },

    // --- Organization ---
    labels: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

noteSchema.index({ user: 1, isTrashed: 1, isArchived: 1 });
noteSchema.index({ title: "text", content: "text" });

export default mongoose.model("Note", noteSchema);
