import { useDispatch, useSelector } from "react-redux";
import { toggleSelect } from "@/features/notes/selectionSlice";
import {
  useTogglePinMutation,
  useToggleArchiveMutation,
  useTrashNoteMutation,
  useRestoreNoteMutation,
  useDeleteNotePermanentlyMutation,
} from "@/features/notes/noteApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pin,
  Archive,
  Trash2,
  RotateCcw,
  Delete,
  Sparkles,
} from "lucide-react";

function ActionBtn({ label, onClick, children, destructive }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={label}
      className={`h-7 w-7 ${destructive ? "hover:text-destructive" : "hover:text-foreground"} text-muted-foreground`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export default function NoteCard({ note, view, onClick }) {
  const dispatch = useDispatch();
  const selectedIds = useSelector((state) => state.selection.selectedIds);
  const isSelected = selectedIds.includes(note._id);
  const isSelecting = selectedIds.length > 0;

  const [togglePin] = useTogglePinMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [trashNote] = useTrashNoteMutation();
  const [restoreNote] = useRestoreNoteMutation();
  const [deleteForever] = useDeleteNotePermanentlyMutation();

  const stop = (e, fn) => {
    e.stopPropagation();
    fn();
  };

  const isTrashView = view === "trashed";

  const handleCardClick = () => {
    if (isSelecting) {
      dispatch(toggleSelect(note._id));
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-xl border bg-card cursor-pointer transition-all break-inside-avoid mb-4 overflow-hidden
        ${
          isSelected
            ? "border-brand shadow-md shadow-brand/10"
            : "border-border hover:border-brand/40 hover:shadow-md"
        }`}
    >
      {/* Always-visible filled pin — only when pinned */}
      {/* {note.isPinned && !isTrashView && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <Pin size={15} className="text-brand fill-amber-50 rotate-45" />
        </div>
      )} */}
      {note.isPinned && !isTrashView && (
        <div className="absolute top-2 right-2 z-10">
          <ActionBtn
            label={note.isPinned ? "Unpin" : "Pin"}
            onClick={(e) => stop(e, () => togglePin(note._id))}
          >
            <Pin
              className="transition-transform duration-200 rotate-45 fill-white"
              size={14}
              fill={note.isPinned ? "currentColor" : "none"}
            />
          </ActionBtn>
        </div>
      )}

      {!isTrashView && !note.isPinned && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100">
          <ActionBtn
            label={note.isPinned ? "Unpin" : "Pin"}
            onClick={(e) => stop(e, () => togglePin(note._id))}
          >
            <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
          </ActionBtn>
        </div>
      )}

      {/* Checkbox — top left, visible on hover or when any card is selected */}
      <div
        className={`absolute top-2.5 left-2.5 z-10 transition-opacity ${
          isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => stop(e, () => dispatch(toggleSelect(note._id)))}
      >
        <div
          className={`w-4.5 h-4.5 border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-brand border-brand"
              : "border-muted-foreground/50 bg-background"
          }`}
        >
          {isSelected && (
            <svg viewBox="0 0 8 6" className="w-2.5 h-2.5 fill-amber-50">
              <path
                d="M1 3l2 2 4-4"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 pt-3">
        {note.title && (
          <h3
            className={`font-display font-medium text-sm mb-1.5 line-clamp-2 ${
              note.isPinned ? "pr-5" : ""
            }`}
          >
            {note.title}
          </h3>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
          {note.content}
        </p>

        {note.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.labels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-xs font-normal"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}

        {note.aiTitleGenerated && (
          <Badge className="mt-2 gap-1 bg-ai/10 text-ai border border-ai/20 text-xs font-mono font-normal hover:bg-ai/10">
            <Sparkles size={11} /> AI title
          </Badge>
        )}
      </div>

      {/* Action strip — slides up on hover, sits below content not over it */}
      {
        <div
          className={`flex items-center justify-end gap-0.5 px-2 pb-2 opacity-0 ${isSelecting ? "" : " group-hover:opacity-100"} transition-opacity`}
        >
          {isTrashView ? (
            <>
              <ActionBtn
                label="Restore"
                onClick={(e) => stop(e, () => restoreNote(note._id))}
              >
                <RotateCcw size={14} />
              </ActionBtn>
              <ActionBtn
                label="Delete forever"
                destructive
                onClick={(e) => stop(e, () => deleteForever(note._id))}
              >
                <Delete size={14} />
              </ActionBtn>
            </>
          ) : (
            <>
              {/* <ActionBtn
                label={note.isPinned ? "Unpin" : "Pin"}
                onClick={(e) => stop(e, () => togglePin(note._id))}
              >
                <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
              </ActionBtn> */}
              <ActionBtn
                label={note.isArchived ? "Unarchive" : "Archive"}
                onClick={(e) => stop(e, () => toggleArchive(note._id))}
              >
                <Archive size={14} />
              </ActionBtn>
              <ActionBtn
                label="Delete"
                destructive
                onClick={(e) => stop(e, () => trashNote(note._id))}
              >
                <Trash2 size={14} />
              </ActionBtn>
            </>
          )}
        </div>
      }
    </div>
  );
}
