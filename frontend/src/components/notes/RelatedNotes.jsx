import { useGetRelatedNotesQuery } from "@/features/notes/noteApi";
import { GitBranch } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function RelatedNotes({ noteId, onSelectNote }) {
  const { data, isLoading } = useGetRelatedNotesQuery(noteId, {
    skip: !noteId,
  });

  const related = data?.notes || [];

  if (isLoading && data) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-36 rounded-lg bg-muted animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!related.length) return null;

  return (
    <>
      <Separator />
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch size={13} className="text-brand" />
          <span className="text-xs font-medium">Related notes</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {related.map((note) => (
            <button
              key={note._id}
              onClick={() => onSelectNote(note)}
              className="min-w-[150px] max-w-[150px] text-left bg-muted/50 hover:bg-muted rounded-lg border border-border p-2.5 shrink-0 transition-colors cursor-pointer"
            >
              {note.title && (
                <p className="text-xs font-medium line-clamp-1 mb-0.5">
                  {note.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {note.content}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
