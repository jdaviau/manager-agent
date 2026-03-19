"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ToolCallIndicator } from "./ToolCallIndicator";
import type { ChatMessage as ChatMessageType } from "@/types/agent";

interface Props {
  messages: ChatMessageType[];
  streamingContent: string;
  activeToolName: string | null;
}

export function ChatMessages({ messages, streamingContent, activeToolName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, activeToolName]);

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <p className="text-2xl">🏆</p>
          <p className="font-medium">Welcome, Coach!</p>
          <p className="text-sm text-muted-foreground">
            Try: &ldquo;Add a player named Alex Johnson, jersey #7&rdquo;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {activeToolName && (
        <div className="flex justify-start">
          <ToolCallIndicator toolName={activeToolName} />
        </div>
      )}

      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground">
            <p className="whitespace-pre-wrap">{streamingContent}</p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
