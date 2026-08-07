import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUpdateNoteMutation } from "@/features/notes/noteApi";
import { X, Tag } from "lucide-react";

export default function LabelDialog({ note, open, onOpenChange }) {
  const [draft, setDraft] = useState("");
  const [labels, setLabels] = useState(note.labels || []);
  const [updateNote] = useUpdateNoteMutation();

  const addLabel = async (value) => {
    const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleaned || labels.includes(cleaned)) return;
    const updated = [...labels, cleaned];
    setLabels(updated);
    setDraft("");
    await updateNote({ id: note._id, labels: updated });
  };

  const removeLabel = async (label) => {
    const updated = labels.filter((l) => l !== label);
    setLabels(updated);
    await updateNote({ id: note._id, labels: updated });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addLabel(draft);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Tag size={16} /> Add labels
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 min-h-8">
          {labels.map((label) => (
            <Badge key={label} variant="secondary" className="gap-1 pr-1 font-normal">
              {label}
              <button
                onClick={() => removeLabel(label)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          {labels.length === 0 && (
            <p className="text-sm text-muted-foreground">No labels yet</p>
          )}
        </div>

        <Input
          autoFocus
          placeholder="Type a label and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addLabel(draft)}
        />
      </DialogContent>
    </Dialog>
  );
}