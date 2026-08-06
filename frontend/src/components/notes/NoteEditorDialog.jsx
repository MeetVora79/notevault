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
import LabelInput from "./LabelInput";
import {
  useUpdateNoteMutation,
  useTrashNoteMutation,
} from "@/features/notes/noteApi";
import { Trash2 } from "lucide-react";

export default function NoteEditorDialog({ note, open, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labels, setLabels] = useState([]);
  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();
  const [trashNote] = useTrashNoteMutation();

  // Sync local form state whenever a different note is opened
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setLabels(note.labels || []);
    }
  }, [note]);

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

  // Save automatically when the dialog closes (clicking outside / pressing Esc)
  const handleOpenChange = (isOpen) => {
    if (!isOpen) handleSave();
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit note</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 shadow-none text-lg font-display font-medium focus-visible:ring-0"
        />

        <textarea
          placeholder="Write a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        <LabelInput labels={labels} onChange={setLabels} />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-gray-200"
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
