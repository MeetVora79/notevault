import { useState } from "react";
import { useCreateNoteMutation } from "@/features/notes/noteApi";
import { useGenerateTitleMutation } from "@/features/ai/aiApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export default function NoteComposer() {
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [aiError, setAiError] = useState("");

  const [createNote, { isLoading: isSaving }] = useCreateNoteMutation();
  const [generateTitle, { isLoading: isGenerating }] =
    useGenerateTitleMutation();

  const hasContent = content.trim().length > 0;

  const handleAiTitle = async () => {
    if (!hasContent) return;
    setAiError("");
    try {
      const result = await generateTitle({
        content,
        _t: Date.now(), // cache buster — makes every request unique
      }).unwrap();
      setTitle(result.title);
    } catch {
      setAiError("Could not generate title. Try again.");
    }
  };

  const handleCreate = async () => {
    if (!hasContent) return;
    await createNote({ title: title.trim(), content: content.trim() });
    setContent("");
    setTitle("");
    setAiError("");
    setExpanded(false);
  };

  const handleCancel = () => {
    setExpanded(false);
    setContent("");
    setTitle("");
    setAiError("");
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm focus-within:border-brand/50 focus-within:shadow-md transition-all">
      {expanded && (
        <div className="flex items-center gap-2 px-3 pt-3">
          <Input
            autoFocus
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 py-5 shadow-none text-base font-display font-medium focus-visible:ring-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasContent || isGenerating}
            onClick={handleAiTitle}
            className={`shrink-0 gap-1.5 text-xs font-medium hover:cursor-pointer transition-colors ${
              hasContent && !isGenerating
                ? "text-ai hover:text-ai hover:bg-accent"
                : "text-muted-foreground"
            }`}
          >
            {isGenerating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {isGenerating ? "Generating..." : "AI Title"}
          </Button>
        </div>
      )}
      <textarea
        placeholder="Take a note..."
        value={content}
        onFocus={() => setExpanded(true)}
        onChange={(e) => setContent(e.target.value)}
        rows={expanded ? 3 : 1}
        className="w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />

      {aiError && (
        <p className="px-3 pb-1 text-xs text-destructive">{aiError}</p>
      )}

      {expanded && (
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            size="sm"
            onClick={handleCreate}
            disabled={isSaving || !hasContent}
          >
            {isSaving ? "Saving..." : "Save note"}
          </Button>
        </div>
      )}
    </div>
  );
}
