import NoteCard from "./NoteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Pin } from "lucide-react";

export default function NoteGrid({ notes, isLoading, view, onNoteClick }) {
  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-32 rounded-xl mb-4 break-inside-avoid"
          />
        ))}
      </div>
    );
  }

  if (!notes?.length) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground text-sm">No notes here yet.</p>
      </div>
    );
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);
  const showLabels = pinnedNotes.length > 0 && unpinnedNotes.length > 0;

  return (
    <div className="space-y-6">
      {/* Pinned section — masonry but comes first */}
      {pinnedNotes.length > 0 && (
        <div>
          {showLabels && (
            <div className="flex items-center gap-2 mb-3">
              <Pin
                size={12}
                className="text-muted-foreground fill-muted-foreground"
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pinned
              </span>
            </div>
          )}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                view={view}
                onClick={() => onNoteClick(note)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unpinned section */}
      {unpinnedNotes.length > 0 && (
        <div>
          {showLabels && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Others
              </span>
            </div>
          )}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                view={view}
                onClick={() => onNoteClick(note)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
