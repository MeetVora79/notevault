import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearSelection, selectAll, exitSelectionMode } from "@/features/notes/selectionSlice";
import {
  useTogglePinMutation,
  useToggleArchiveMutation,
  useTrashNoteMutation,
  useRestoreNoteMutation,
  useDeleteNotePermanentlyMutation,
} from "@/features/notes/noteApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  Pin,
  PinOff,
  Archive,
  ArchiveX,
  Trash2,
  RotateCcw,
  Delete,
  CheckSquare,
  Square,
} from "lucide-react";

const MAX_PINS = 3;

export default function Navbar({
  onSearch,
  pinnedCount,
  activeView,
  onViewChange,
  currentNotes = [],
}) {
  const dispatch = useDispatch();
  const selectedIds = useSelector((state) => state.selection.selectedIds);
  const isSelectionMode = useSelector((state) => state.selection.isSelectionMode);
  const isSelecting = isSelectionMode;

  const allIds = currentNotes.map((n) => n._id);
  const isAllSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const [togglePin] = useTogglePinMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [trashNote] = useTrashNoteMutation();
  const [restoreNote] = useRestoreNoteMutation();
  const [deleteForever] = useDeleteNotePermanentlyMutation();
  const [pinWarning, setPinWarning] = useState(false);

  const isTrashed = activeView === "trashed";
  const isPinned = activeView === "pinned";
  const isArchived = activeView === "archived";

  const handleSelectAll = () => {
    if (isAllSelected) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAll(allIds));
    }
  };

  const handleBulkPin = async () => {
    if (isPinned) {
      // In pinned view — unpin all selected
      await Promise.all(selectedIds.map((id) => togglePin(id)));
      dispatch(clearSelection());
      return;
    }
    const slotsLeft = MAX_PINS - pinnedCount;
    if (slotsLeft <= 0) {
      setPinWarning(true);
      setTimeout(() => setPinWarning(false), 3000);
      return;
    }
    const toPin = selectedIds.slice(0, slotsLeft);
    await Promise.all(toPin.map((id) => togglePin(id)));
    dispatch(clearSelection());
  };

  const handleBulkArchive = async () => {
    await Promise.all(selectedIds.map((id) => toggleArchive(id)));
    dispatch(clearSelection());
  };

  const handleBulkTrash = async () => {
    await Promise.all(selectedIds.map((id) => trashNote(id)));
    dispatch(clearSelection());
  };

  const handleBulkRestore = async () => {
    await Promise.all(selectedIds.map((id) => restoreNote(id)));
    dispatch(clearSelection());
  };

  const handleBulkDeleteForever = async () => {
    await Promise.all(selectedIds.map((id) => deleteForever(id)));
    dispatch(clearSelection());
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 gap-4">
      {isSelecting ? (
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hover:cursor-pointer"
            onClick={() => dispatch(exitSelectionMode())}
          >
            <X size={16} />
          </Button>
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>

          {/* Select all / unselect all */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSelectAll}
          >
            {isAllSelected ? (
              <>
                <CheckSquare size={15} className="text-brand" />
                <span className="text-xs">Unselect all</span>
              </>
            ) : (
              <>
                <Square size={15} />
                <span className="text-xs">Select all ({allIds.length})</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            {pinWarning && (
              <span className="text-xs text-destructive">
                Max {MAX_PINS} pinned notes reached
              </span>
            )}

            {/* Trash view actions */}
            {isTrashed ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:cursor-pointer"
                  onClick={handleBulkRestore}
                >
                  <RotateCcw size={14} /> Restore
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:border-destructive hover:text-destructive hover:cursor-pointer"
                  onClick={handleBulkDeleteForever}
                >
                  <Delete size={14} /> Delete forever
                </Button>
              </>
            ) : (
              <>
                {/* Pin/Unpin — hidden in archive view since archived notes shouldn't be pinned */}
                {!isArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:cursor-pointer"
                    onClick={handleBulkPin}
                  >
                    {isPinned ? (
                      <>
                        <PinOff size={14} /> Unpin
                      </>
                    ) : (
                      <>
                        <Pin size={14} /> Pin
                      </>
                    )}
                  </Button>
                )}

                {/* Archive/Unarchive */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:cursor-pointer"
                  onClick={handleBulkArchive}
                >
                  {isArchived ? (
                    <>
                      <ArchiveX size={14} /> Unarchive
                    </>
                  ) : (
                    <>
                      <Archive size={14} /> Archive
                    </>
                  )}
                </Button>

                {/* Delete — not shown in trash view since we handle that above */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:border-destructive hover:text-destructive hover:cursor-pointer"
                  onClick={handleBulkTrash}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search notes..."
            className="pl-9 h-9 bg-muted/50 border-transparent shadow-sm focus:bg-background focus:border-border transition-all"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
    </header>
  );
}
