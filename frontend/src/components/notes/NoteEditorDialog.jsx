import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LabelInput from "./LabelInput";
import { useUpdateNoteMutation, useTrashNoteMutation } from "@/features/notes/noteApi";
import { useSummarizeNoteMutation } from "@/features/ai/aiApi";
import { Trash2, Sparkles, Loader2, RotateCcw } from "lucide-react";

export default function NoteEditorDialog({ note, open, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labels, setLabels] = useState([]);
  const [summary, setSummary] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);

  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();
  const [trashNote] = useTrashNoteMutation();
  const [summarizeNote, { isLoading: isSummarizing }] = useSummarizeNoteMutation();

  // Sync state when a different note is opened
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setLabels(note.labels || []);
      setSummary(note.summary || "");
      // Auto-show summary panel if note already has one saved
      setSummaryVisible(!!note.summary);
    }
  }, [note]);

  const handleSummarize = async (regenerate = false) => {
    try {
      const result = await summarizeNote({
        content,
        noteId: note._id,
        _t: regenerate ? Date.now() : undefined,
      }).unwrap();
      setSummary(result.summary);
      setSummaryVisible(true);
    } catch {
      // silently fail — button stays clickable for retry
    }
  };

  const handleSave = async () => {
    await updateNote({
      id: note._id,
      title: title.trim(),
      content: content.trim(),
      labels,
    });
    onClose();
  };

  const handleDelete = async () => {
    await trashNote(note._id);
    onClose();
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) handleSave();
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit note</DialogTitle>
        </DialogHeader>

        {/* Title */}
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 shadow-none text-lg font-display font-medium focus-visible:ring-0"
        />

        {/* Content */}
        <textarea
          placeholder="Write a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        <Separator />

        {/* Summarize section */}
        <div className="space-y-2">
          {!summaryVisible ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-ai hover:text-ai hover:bg-ai/10 cursor-pointer"
              onClick={() => handleSummarize(false)}
              disabled={isSummarizing || !content.trim()}
            >
              {isSummarizing
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />
              }
              {isSummarizing ? "Summarizing..." : "Summarize this note"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ai flex items-center gap-1.5">
                  <Sparkles size={11} /> AI Summary
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => handleSummarize(true)}
                  disabled={isSummarizing}
                >
                  {isSummarizing
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RotateCcw size={11} />
                  }
                  Regenerate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed bg-ai/5 border border-ai/15 rounded-lg px-3 py-2">
                {isSummarizing ? "Regenerating..." : summary}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Labels */}
        <LabelInput labels={labels} onChange={setLabels} />

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}