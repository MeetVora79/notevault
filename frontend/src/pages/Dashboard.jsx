import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useGetNotesQuery } from "@/features/notes/noteApi";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import NoteComposer from "@/components/notes/NoteComposer";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteEditorDialog from "@/components/notes/NoteEditorDialog";
import { exitSelectionMode } from "@/features/notes/selectionSlice";
import ChatPanel from "@/components/chat/ChatPanel";

export default function Dashboard() {
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
    let list = data?.notes || [];
    if (activeView === "pinned") list = list.filter((n) => n.isPinned);
    if (activeView.startsWith("label:")) {
      const label = activeView.split(":")[1];
      list = list.filter((n) => n.labels?.includes(label));
    }
    if (search.trim()) {
      const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((n) => {
        const text =
          `${n.title || ""} ${n.content || ""} ${(n.labels || []).join(" ")}`.toLowerCase();
        return words.every((word) => text.includes(word));
      });
    }
    return list;
  }, [data, activeView, search]);

  const allLabels = useMemo(() => {
    const set = new Set();
    (data?.notes || []).forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [data]);

  const handleSearch = (query) => {
    setSearch(query);
  };

  useEffect(() => {
    const titles = {
      all: "NoteVault — All notes",
      pinned: "NoteVault — Pinned",
      archived: "NoteVault — Archive",
      trashed: "NoteVault — Trash",
    };

    if (activeView.startsWith("label:")) {
      const label = activeView.split(":")[1];
      document.title = `NoteVault — ${label}`;
    } else {
      document.title = titles[activeView] || "NoteVault";
    }

    // Reset on unmount
    return () => {
      document.title = "NoteVault — AI-powered note taking";
    };
  }, [activeView]);

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
          currentNotes={notes}
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
              isLoading={isLoading}
              view={activeView}
              onNoteClick={setEditingNote}
              searchQuery={search}
            />
          </div>
        </main>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      <NoteEditorDialog
        note={editingNote}
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
      />
    </div>
  );
}
