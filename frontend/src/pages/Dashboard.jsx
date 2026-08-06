import { useState, useMemo } from "react";
import { useGetNotesQuery } from "@/features/notes/noteApi";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import NoteComposer from "@/components/notes/NoteComposer";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteEditorDialog from "@/components/notes/NoteEditorDialog";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");

  const queryParams = useMemo(() => {
    if (activeView === "archived") return { archived: "true", trashed: "false" };
    if (activeView === "trashed") return { archived: "false", trashed: "true" };
    return { archived: "false", trashed: "false" };
  }, [activeView]);

  const { data, isLoading } = useGetNotesQuery(queryParams);

  const notes = useMemo(() => {
    let list = data?.notes || [];
    if (activeView === "pinned") list = list.filter((n) => n.isPinned);
    if (activeView.startsWith("label:")) {
      const label = activeView.split(":")[1];
      list = list.filter((n) => n.labels?.includes(label));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.labels?.some((l) => l.includes(q))
      );
    }
    return list;
  }, [data, activeView, search]);

  const pinnedCount = useMemo(
    () => (data?.notes || []).filter((n) => n.isPinned).length,
    [data]
  );

  const allLabels = useMemo(() => {
    const set = new Set();
    (data?.notes || []).forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [data]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} labels={allLabels} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onSearch={setSearch} pinnedCount={pinnedCount} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {activeView === "all" && !search && (
              <div className="mb-8">
                <NoteComposer />
              </div>
            )}
            <NoteGrid
              notes={notes}
              isLoading={isLoading}
              view={activeView}
              onNoteClick={setEditingNote}
            />
          </div>
        </main>
      </div>
      <NoteEditorDialog
        note={editingNote}
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
      />
    </div>
  );
}