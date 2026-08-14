import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSelection,
  selectAll,
  exitSelectionMode,
} from "@/features/notes/selectionSlice";
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
  BotMessageSquare,
} from "lucide-react";
import { Menu } from "lucide-react";
import { openMobileMenu } from "@/components/layout/Sidebar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

export default function Navbar({
  onSearch,
  activeView,
  currentNotes = [],
  onChatToggle,
  chatOpen,
}) {
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const dispatch = useDispatch();
  const selectedIds = useSelector((state) => state.selection.selectedIds);
  const isSelectionMode = useSelector(
    (state) => state.selection.isSelectionMode,
  );
  const isSelecting = isSelectionMode;

  const allIds = currentNotes.map((n) => n._id);
  const isAllSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const [togglePin] = useTogglePinMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [trashNote] = useTrashNoteMutation();
  const [restoreNote] = useRestoreNoteMutation();
  const [deleteForever] = useDeleteNotePermanentlyMutation();

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
      await Promise.all(selectedIds.map((id) => togglePin(id)));
      dispatch(clearSelection());
      return;
    }
    await Promise.all(selectedIds.map((id) => togglePin(id)));
    dispatch(clearSelection());
  };

  const handleBulkArchive = async () => {
    await Promise.all(selectedIds.map((id) => toggleArchive(id)));
    dispatch(clearSelection());
    toast.success(
      `${selectedIds.length} note${selectedIds.length > 1 ? "s" : ""} ${isArchived ? "unarchived" : "archived"}`,
    );
  };

  const handleBulkTrash = async () => {
    await Promise.all(selectedIds.map((id) => trashNote(id)));
    dispatch(clearSelection());
    toast.success(
      `${selectedIds.length} note${selectedIds.length > 1 ? "s" : ""} moved to trash`,
    );
  };

  const handleBulkRestore = async () => {
    await Promise.all(selectedIds.map((id) => restoreNote(id)));
    dispatch(clearSelection());
    toast.success(
      `${selectedIds.length} note${selectedIds.length > 1 ? "s" : ""} restored`,
    );
  };

  const handleBulkDeleteForever = async () => {
    setConfirmBulkDelete(false);
    await Promise.all(selectedIds.map((id) => deleteForever(id)));
    dispatch(clearSelection());
    toast.error(
      `${selectedIds.length} note${selectedIds.length > 1 ? "s" : ""} permanently deleted`,
    );
  };

  return (
    <>
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
              className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
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

            <div className="flex items-center gap-2 ml-auto overflow-x-auto">
              {/* Trash view actions */}
              {isTrashed ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0 text-xs hover:cursor-pointer"
                    onClick={handleBulkRestore}
                  >
                    <RotateCcw size={14} />{" "}
                    <span className="hidden sm:inline">Restore</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0 text-xs hover:border-destructive hover:text-destructive hover:cursor-pointer"
                    onClick={() => setConfirmBulkDelete(true)}
                  >
                    <Delete size={14} />{" "}
                    <span className="hidden sm:inline">Delete forever</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Pin/Unpin — hidden in archive view since archived notes shouldn't be pinned */}
                  {!isArchived && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0 text-xs hover:cursor-pointer"
                      onClick={handleBulkPin}
                    >
                      {isPinned ? (
                        <>
                          <PinOff size={14} />{" "}
                          <span className="hidden sm:inline">Unpin</span>
                        </>
                      ) : (
                        <>
                          <Pin size={14} />{" "}
                          <span className="hidden sm:inline">Pin</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Archive/Unarchive */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0 text-xs hover:cursor-pointer"
                    onClick={handleBulkArchive}
                  >
                    {isArchived ? (
                      <>
                        <ArchiveX size={14} />{" "}
                        <span className="hidden sm:inline">Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive size={14} />{" "}
                        <span className="hidden sm:inline">Archive</span>
                      </>
                    )}
                  </Button>

                  {/* Delete — not shown in trash view since we handle that above */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0 text-xs hover:border-destructive hover:text-destructive hover:cursor-pointer"
                    onClick={handleBulkTrash}
                  >
                    <Trash2 size={14} />{" "}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 lg:hidden cursor-pointer"
              onClick={openMobileMenu}
            >
              <Menu size={18} />
            </Button>

            <div className="relative w-full max-w-md flex-1 min-w-0">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                ref={searchInputRef}
                placeholder="Search notes..."
                value={searchValue}
                className="pl-9 h-9 shadow-sm bg-muted/50 border-transparent focus:bg-background focus:border-border transition-all"
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue("");
                    onSearch("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* Chat toggle button */}
            <Button
              variant={chatOpen ? "default" : "ghost"}
              className={`gap-1 cursor-pointer bg-accent/70 shrink-0 ${chatOpen ? "bg-brand hover:bg-brand/90" : ""}`}
              onClick={onChatToggle}
            >
              <span>Chat</span>
              <BotMessageSquare size={16} />
            </Button>
          </div>
        )}
      </header>
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedIds.length} note${selectedIds.length > 1 ? "s" : ""} forever?`}
        description="These notes will be permanently deleted and cannot be recovered. This action cannot be undone."
        confirmLabel={`Delete ${selectedIds.length} forever`}
        onConfirm={handleBulkDeleteForever}
      />
    </>
  );
}
