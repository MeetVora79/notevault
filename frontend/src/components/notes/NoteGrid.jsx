import NoteCard from "./NoteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Pin, FileText, Archive, Trash2, Tag, Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function NoteGrid({
  notes,
  isLoading,
  view,
  onNoteClick,
  searchQuery,
}) {
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
    // Search empty state
    if (searchQuery?.trim()) {
      return (
        <EmptyState
          icon={<Search size={22} className="text-muted-foreground" />}
          title="No results found"
          description={`No notes match "${searchQuery}". Try different keywords.`}
        />
      );
    }

    // View-specific empty states
    if (view === "pinned") {
      return (
        <EmptyState
          icon={<Pin size={22} className="text-muted-foreground" />}
          title="No pinned notes"
          description="Pin important notes to keep them at the top for quick access."
        />
      );
    }

    if (view === "archived") {
      return (
        <EmptyState
          icon={<Archive size={22} className="text-muted-foreground" />}
          title="Nothing archived"
          description="Notes you archive will appear here. Archive notes you want to keep but don't need right now."
        />
      );
    }

    if (view === "trashed") {
      return (
        <EmptyState
          icon={<Trash2 size={22} className="text-muted-foreground" />}
          title="Trash is empty"
          description="Deleted notes will appear here. Notes in trash are permanently deleted after 30 days."
        />
      );
    }

    if (view?.startsWith("label:")) {
      const label = view.split(":")[1];
      return (
        <EmptyState
          icon={<Tag size={22} className="text-muted-foreground" />}
          title={`No notes labeled "${label}"`}
          description="Add this label to a note from the note's menu to see it here."
        />
      );
    }

    // Default — all notes, new user
    return (
      <EmptyState
        icon={<FileText size={22} className="text-muted-foreground" />}
        title="No notes yet"
        description="Write your first note using the composer above. Your notes will appear here."
      />
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
                searchQuery={searchQuery}
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
