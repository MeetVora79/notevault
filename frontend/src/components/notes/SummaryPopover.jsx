import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSummarizeNoteMutation } from "@/features/ai/aiApi";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";

export default function SummaryPopover({ note, children, onOpenChange }) {
  const [open, setOpen] = useState(false);
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

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    // Auto-generate if no summary exists and popover opens
    if (isOpen && !summary && note.content?.trim()) {
      handleSummarize(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-ai flex items-center gap-1.5">
            <Sparkles size={11} /> AI Summary
          </p>
          {summary && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground gap-1"
              onClick={() => handleSummarize(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <RotateCcw size={10} />
              )}
              Regenerate
            </Button>
          )}
        </div>

        {isLoading && !summary ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 size={12} className="animate-spin" />
            Generating summary...
          </div>
        ) : summary ? (
          <p className="text-xs text-muted-foreground leading-relaxed bg-ai/5 border border-ai/15 rounded-lg px-3 py-2">
            {summary}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">No summary yet.</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-xs h-7"
              onClick={() => handleSummarize(false)}
              disabled={!note.content?.trim()}
            >
              <Sparkles size={11} /> Generate summary
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
