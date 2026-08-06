import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function LabelInput({ labels, onChange }) {
  const [draft, setDraft] = useState("");

  const addLabel = () => {
    const cleaned = draft.trim().toLowerCase().replace(/\s+/g, "-");
    if (cleaned && !labels.includes(cleaned)) {
      onChange([...labels, cleaned]);
    }
    setDraft("");
  };

  const removeLabel = (label) => {
    onChange(labels.filter((l) => l !== label));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addLabel();
    }
    if (e.key === "Backspace" && !draft && labels.length > 0) {
      removeLabel(labels[labels.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {labels.map((label) => (
          <Badge
            key={label}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
          >
            {label}
            <button
              onClick={() => removeLabel(label)}
              className="hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Add a label, press Enter"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addLabel}
        className="h-8 text-sm"
      />
    </div>
  );
}
