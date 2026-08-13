import { useState, useRef, useEffect } from "react";
import { useChatWithNotesMutation } from "@/features/ai/aiApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Send, Sparkles, Loader2, FileText, Bot, User } from "lucide-react";

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-brand/10" : "bg-ai/10"
        }`}
      >
        {isUser ? (
          <User size={13} className="text-brand" />
        ) : (
          <Bot size={13} className="text-ai" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Message bubble */}
        <div
          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "bg-brand text-white rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [chatWithNotes, { isLoading }] = useChatWithNotesMutation();

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const result = await chatWithNotes({
        message: userMessage.content,
        history: messages,
        _t: Date.now(),
      }).unwrap();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          sources: [],
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => setMessages([]);

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-80 xl:w-96 bg-background border-l border-border z-30 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header — fixed height, never shrinks */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ai/10 flex items-center justify-center">
              <Sparkles size={18} className="text-ai" />
            </div>
            <div>
              <p className="text-sm font-medium font-display">
                Chat with notes
              </p>
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground cursor-pointer h-7 px-2"
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={onClose}
            >
              <X size={15} />
            </Button>
          </div>
        </div>

        {/* Messages — takes all remaining space, scrolls internally */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-ai/10 flex items-center justify-center">
                <Sparkles size={22} className="text-ai" />
              </div>
              <div>
                <p className="text-sm font-medium">Ask about your notes</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Ask anything — travel plans, meeting notes,
                  <br />
                  ideas, tasks, or anything you've written.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                {[
                  "What are my pending tasks?",
                  "Summarize my work notes",
                  "What did I write about travel?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:bg-accent hover:border-brand/30 transition-colors text-muted-foreground cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-ai/10 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-ai" />
                  </div>
                  <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                    <Loader2
                      size={14}
                      className="animate-spin text-muted-foreground"
                    />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input — fixed height, never shrinks */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              placeholder="Ask anything about your notes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="text-sm h-9"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 bg-accent cursor-pointer hover:bg-brand/90"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Chat across your all notes using AI
          </p>
        </div>
      </div>
    </>
  );
}
