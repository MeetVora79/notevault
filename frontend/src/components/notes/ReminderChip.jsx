import { useState } from "react";
import { Bell, BellOff, Check, Undo2 } from "lucide-react";
import {
  useAcknowledgeReminderMutation,
  useUnacknowledgeReminderMutation,
  useRemoveReminderMutation,
} from "@/features/notes/noteApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReminderChip({ reminder, noteId }) {
  const [open, setOpen] = useState(false);
  const [acknowledge] = useAcknowledgeReminderMutation();
  const [unacknowledge] = useUnacknowledgeReminderMutation();
  const [removeReminder] = useRemoveReminderMutation();

  const handleAcknowledge = async (e) => {
    e.stopPropagation();
    try {
      await acknowledge({ noteId, reminderId: reminder._id }).unwrap();
      toast.success("Reminder acknowledged");
    } catch {
      toast.error("Failed to acknowledge reminder");
    }
    setOpen(false);
  };

  const handleUnacknowledge = async (e) => {
    e.stopPropagation();
    try {
      await unacknowledge({ noteId, reminderId: reminder._id }).unwrap();
      toast.success("Reminder marked as active");
    } catch {
      toast.error("Failed to undo");
    }
    setOpen(false);
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    try {
      await removeReminder({ noteId, reminderId: reminder._id }).unwrap();
      toast.success("Reminder removed");
    } catch {
      toast.error("Failed to remove reminder");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
            reminder.acknowledged
              ? "bg-muted text-muted-foreground border-muted line-through"
              : "bg-[#0e5fb0] text-white border-ai/20 hover:bg-ai/20"
          }`}
        >
          {reminder.acknowledged ? <Check size={10} /> : <Bell size={10} />}
          <span>{reminder.text}</span>
          {reminder.datetime && (
            <span className="opacity-70">· {reminder.datetime}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} className="text-ai" />
          <p className="text-xs font-medium">Suggested reminder</p>
        </div>
        <p className="text-sm font-medium mb-0.5">{reminder.text}</p>
        {reminder.datetime && (
          <p className="text-xs text-muted-foreground mb-3">
            {reminder.datetime}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7 gap-1 cursor-pointer"
            onClick={handleRemove}
          >
            <BellOff size={11} /> {reminder.acknowledged ? "Remove" : "Dismiss"}
          </Button>

          {reminder.acknowledged ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-7 gap-1"
              onClick={handleUnacknowledge}
            >
              <Undo2 size={11} /> Undo
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 text-xs h-7 gap-1 cursor-pointer"
              onClick={handleAcknowledge}
            >
              <Check size={11} /> Got it
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
