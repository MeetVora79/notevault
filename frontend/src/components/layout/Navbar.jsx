import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearSelection } from "@/features/notes/selectionSlice";
import {
  useTogglePinMutation,
  useToggleArchiveMutation,
  useTrashNoteMutation,
} from "@/features/notes/noteApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Pin, Archive, Trash2 } from "lucide-react";

const MAX_PINS = 3;

export default function Navbar({ onSearch, pinnedCount }) {
  const dispatch = useDispatch();
  const selectedIds = useSelector((state) => state.selection.selectedIds);
  const isSelecting = selectedIds.length > 0;

  const [togglePin] = useTogglePinMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [trashNote] = useTrashNoteMutation();
  const [pinWarning, setPinWarning] = useState(false);

  const handleBulkPin = async () => {
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

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-6 gap-4">
      {isSelecting ? (
        // --- Selection mode ---
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => dispatch(clearSelection())}
          >
            <X size={16} />
          </Button>
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} selected
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {pinWarning && (
              <span className="text-xs text-destructive">
                Max {MAX_PINS} pinned notes reached
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleBulkPin}
            >
              <Pin size={14} /> Pin
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleBulkArchive}
            >
              <Archive size={14} /> Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:border-destructive hover:text-destructive"
              onClick={handleBulkTrash}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      ) : (
        // --- Normal search mode ---
        <div className="relative w-full max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search notes..."
            className="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-border transition-all"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
    </header>
  );
}
