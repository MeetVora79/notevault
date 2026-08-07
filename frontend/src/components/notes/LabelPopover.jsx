import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUpdateNoteMutation } from "@/features/notes/noteApi";
import { X } from "lucide-react";

export default function LabelPopover({ note, children, onOpenChange }) {
  const [open, setOpen] = useState(false);
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
    <Popover
      open={open}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        setOpen(open)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">Labels</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {labels.map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="gap-1 pr-1 font-normal text-xs"
            >
              #{label}
              <button
                onClick={() => removeLabel(label)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X size={9} />
              </button>
            </Badge>
          ))}
          {labels.length === 0 && (
            <p className="text-xs text-muted-foreground">No labels yet</p>
          )}
        </div>
        <Input
          autoFocus
          placeholder="Add label, press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addLabel(draft)}
          className="h-7 text-xs"
        />
      </PopoverContent>
    </Popover>
  );
}
