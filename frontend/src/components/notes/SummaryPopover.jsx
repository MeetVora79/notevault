import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSummarizeNoteMutation } from "@/features/ai/aiApi";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";

export default function SummaryDialog({ note, open, onOpenChange }) {
  const [summary, setSummary] = useState(note.summary || "");
  const [summarizeNote, { isLoading }] = useSummarizeNoteMutation();

  const handleSummarize = async (regenerate = false) => {
    try {
      const result = await summarizeNote({
        content: note.content,
        noteId: note._id,
        _t: regenerate ? Date.now() : undefined,
      }).unwrap();
      setSummary(result.summary);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (open && !summary && note.content?.trim()) {
      handleSummarize(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} className="text-ai" /> AI Summary
          </DialogTitle>
        </DialogHeader>

        {isLoading && !summary ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 size={14} className="animate-spin" />
            Generating summary...
          </div>
        ) : summary ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed bg-ai/5 border border-ai/15 rounded-lg px-3 py-3">
              {isLoading ? "Regenerating..." : summary}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleSummarize(true)}
              disabled={isLoading}
            >
              {isLoading
                ? <Loader2 size={13} className="animate-spin" />
                : <RotateCcw size={13} />
              }
              Regenerate
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">No summary yet.</p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => handleSummarize(false)}
              disabled={!note.content?.trim()}
            >
              <Sparkles size={13} /> Generate summary
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}