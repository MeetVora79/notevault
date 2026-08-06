import { useState } from "react";
import { useCreateNoteMutation } from "@/features/notes/noteApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NoteComposer() {
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [createNote, { isLoading }] = useCreateNoteMutation();

  const handleCreate = async () => {
    if (!content.trim()) return;
    await createNote({ title: title.trim(), content: content.trim() });
    setContent("");
    setTitle("");
    setExpanded(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm focus-within:border-brand/50 focus-within:shadow-md transition-all">
      {expanded && (
        <Input
          autoFocus
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 py-5 shadow-none text-base font-display font-medium focus-visible:ring-0"
        />
      )}
      <textarea
        placeholder="Take a note..."
        value={content}
        onFocus={() => setExpanded(true)}
        onChange={(e) => setContent(e.target.value)}
        rows={expanded ? 3 : 1}
        className="w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      {expanded && (
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setExpanded(false);
              setContent("");
              setTitle("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? "Saving..." : "Save note"}
          </Button>
        </div>
      )}
    </div>
  );
}
