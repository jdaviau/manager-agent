"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";
import Link from "next/link";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  isAtLimit?: boolean;
  limitResetDate?: string;
}

export function ChatInput({ onSend, disabled, isAtLimit, limitResetDate }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-grow textarea up to ~5 lines
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  if (isAtLimit) {
    return (
      <div className="flex flex-col items-center gap-1.5 p-4 border-t bg-white text-center">
        <p className="text-xs text-muted-foreground">
          Monthly prompt limit reached
          {limitResetDate ? ` — resets ${limitResetDate}` : ""}.
        </p>
        <Link href="/billing" className="text-xs font-medium text-primary hover:underline">
          Upgrade your plan
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t bg-white">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Message your assistant... (Enter to send)"
        disabled={disabled}
        rows={1}
        className="resize-none min-h-[40px] max-h-[140px] overflow-y-auto bg-muted/50 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 rounded-xl text-sm"
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className="shrink-0 mb-0.5 rounded-xl h-10 w-10"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  );
}
