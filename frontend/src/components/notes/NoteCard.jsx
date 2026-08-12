import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSelect,
  enterSelectionMode,
} from "@/features/notes/selectionSlice";
import {
  useTogglePinMutation,
  useToggleArchiveMutation,
  useTrashNoteMutation,
  useRestoreNoteMutation,
  useDeleteNotePermanentlyMutation,
  useCopyNoteMutation,
} from "@/features/notes/noteApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LabelDialog from "./LabelPopover";
import SummaryDialog from "./SummaryPopover";
import { highlightText } from "@/utils/highlight";
import {
  Pin,
  Archive,
  Trash2,
  RotateCcw,
  Delete,
  Sparkles,
  MoreVertical,
  Tag,
  Copy,
  ClipboardCopy,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

function ActionBtn({ label, onClick, children, destructive }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={label}
      className={`h-7 w-7 cursor-pointer ${destructive ? "hover:text-destructive" : "hover:text-foreground"} text-muted-foreground`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export default function NoteCard({ note, view, onClick, searchQuery }) {
  const dispatch = useDispatch();
  const selectedIds = useSelector((state) => state.selection.selectedIds);
  const isSelectionMode = useSelector(
    (state) => state.selection.isSelectionMode,
  );
  const isSelected = selectedIds.includes(note._id);
  const isSelecting = isSelectionMode;

  const [labelOpen, setLabelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [togglePin] = useTogglePinMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [trashNote] = useTrashNoteMutation();
  const [restoreNote] = useRestoreNoteMutation();
  const [deleteForever] = useDeleteNotePermanentlyMutation();
  const [copyNote] = useCopyNoteMutation();

  const stop = (e, fn) => {
    e.stopPropagation();
    fn();
  };

  const isTrashView = view === "trashed";

  const handleCardClick = () => {
    if (dropdownOpen || labelOpen || summaryOpen) return;
    if (isSelecting) {
      dispatch(toggleSelect(note._id));
    } else {
      onClick();
    }
  };

  const handleCopyToClipboard = () => {
    const text = note.title ? `${note.title}\n\n${note.content}` : note.content;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <>
      {/* Dialogs rendered outside card — portal into body, zero event conflict */}
      <LabelDialog note={note} open={labelOpen} onOpenChange={setLabelOpen} />
      <SummaryDialog
        note={note}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this note forever?"
        description="This note will be permanently deleted and cannot be recovered. This action cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={async () => {
          await deleteForever(note._id);
          toast.error("Note permanently deleted");
        }}
      />
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
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 cursor-pointer">
            <ActionBtn
              label={note.isPinned ? "Unpin" : "Pin"}
              onClick={(e) => stop(e, () => togglePin(note._id))}
            >
              <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
            </ActionBtn>
          </div>
        )}

        {/* Checkbox — bottom left, visible on hover or when any card is selected */}
        <div
          className={`absolute bottom-3 left-3 z-10 transition-opacity ${
            isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) =>
            stop(e, () => {
              if (!isSelectionMode) dispatch(enterSelectionMode());
              dispatch(toggleSelect(note._id));
            })
          }
        >
          <div
            className={`w-4.5 h-4.5 rounded-sm border-2 flex items-center justify-center transition-colors ${
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
              {highlightText(note.title, searchQuery)}
            </h3>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
            {highlightText(note.content, searchQuery)}
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
            <div className="flex items-center gap-0.5">
              {isTrashView ? (
                <>
                  <ActionBtn
                    label="Restore"
                    onClick={(e) =>
                      stop(e, async () => {
                        await restoreNote(note._id);
                        toast.success("Note restored");
                      })
                    }
                  >
                    <RotateCcw size={14} />
                  </ActionBtn>
                  <ActionBtn
                    label="Delete forever"
                    destructive
                    onClick={(e) => stop(e, () => setConfirmOpen(true))}
                  >
                    <Delete size={14} />
                  </ActionBtn>
                </>
              ) : (
                <>
                  <ActionBtn
                    label={note.isArchived ? "Unarchive" : "Archive"}
                    onClick={(e) =>
                      stop(e, async () => {
                        await toggleArchive(note._id);
                        toast.success(
                          note.isArchived ? "Note unarchived" : "Note archived",
                        );
                      })
                    }
                  >
                    <Archive size={14} className="cursor-pointer" />
                  </ActionBtn>
                </>
              )}
            </div>

            {/* Kebab menu — only on non-trash views */}
            {!isTrashView && (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(true);
                    }}
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Summarize */}
                  <DropdownMenuItem
                    onClick={() => {
                      setDropdownOpen(false);
                      setTimeout(() => setSummaryOpen(true), 50);
                    }}
                  >
                    <Sparkles size={14} className="mr-2 text-ai" />
                    Summarize note
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Add label */}
                  <DropdownMenuItem
                    onClick={() => {
                      setDropdownOpen(false);
                      setTimeout(() => setLabelOpen(true), 50);
                    }}
                  >
                    <Tag size={14} className="mr-2" />
                    Add label
                  </DropdownMenuItem>

                  {/* Copy to clipboard */}
                  <DropdownMenuItem onClick={handleCopyToClipboard}>
                    <ClipboardCopy size={14} className="mr-2" />
                    Copy to clipboard
                  </DropdownMenuItem>

                  {/* Make a copy */}
                  <DropdownMenuItem
                    onClick={() => {
                      copyNote(note._id);
                      toast.success("Note duplicated");
                    }}
                  >
                    <Copy size={14} className="mr-2" />
                    Make a copy
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Delete */}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      trashNote(note._id);
                      toast.success("Note moved to trash");
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      </div>
    </>
  );
}
