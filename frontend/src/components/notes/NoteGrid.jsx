import NoteCard from "./NoteCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function NoteGrid({ notes, isLoading, view, onNoteClick }) {
  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl mb-4 break-inside-avoid" />
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

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note._id} note={note} view={view} onClick={() => onNoteClick(note)} />
      ))}
    </div>
  );
}