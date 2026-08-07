import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useGetNotesQuery } from "@/features/notes/noteApi";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import NoteComposer from "@/components/notes/NoteComposer";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteEditorDialog from "@/components/notes/NoteEditorDialog";
import { exitSelectionMode } from "@/features/notes/selectionSlice";
import { useSemanticSearchMutation } from "@/features/ai/aiApi";
import ChatPanel from "@/components/chat/ChatPanel";

export default function Dashboard() {
  const [semanticSearch] = useSemanticSearchMutation();
  const [semanticResults, setSemanticResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const dispatch = useDispatch();

  const handleViewChange = (view) => {
    dispatch(exitSelectionMode());
    setActiveView(view);
  };

  const queryParams = useMemo(() => {
    if (activeView === "archived")
      return { archived: "true", trashed: "false" };
    if (activeView === "trashed") return { archived: "false", trashed: "true" };
    return { archived: "false", trashed: "false" };
  }, [activeView]);

  const { data, isLoading } = useGetNotesQuery(queryParams);

  const notes = useMemo(() => {
    // Use semantic search results if available
    if (semanticResults !== null) return semanticResults;

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
          n.labels?.some((l) => l.includes(q)),
      );
    }
    return list;
  }, [data, activeView, search, semanticResults]);

  const allLabels = useMemo(() => {
    const set = new Set();
    (data?.notes || []).forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [data]);

  const handleSearch = async (query) => {
    setSearch(query);
    if (query.trim().length > 3) {
      setIsSearching(true);
      try {
        const result = await semanticSearch({ query }).unwrap();
        setSemanticResults(result.notes);
      } catch {
        setSemanticResults(null);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSemanticResults(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        labels={allLabels}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onSearch={handleSearch}
          activeView={activeView}
          onViewChange={handleViewChange}
          currentNotes={notes}
          isSearching={isSearching}
          onChatToggle={() => setChatOpen((prev) => !prev)}
          chatOpen={chatOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {activeView === "all" && !search && (
              <div className="mb-8">
                <NoteComposer />
              </div>
            )}
            <NoteGrid
              notes={notes}
              isLoading={isLoading || isSearching}
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
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
