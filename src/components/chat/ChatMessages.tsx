"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        <div className="space-y-4 max-w-[220px]">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-2xl mx-auto">
            🏆
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-sm">Welcome, Team Manager!</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I can help you manage your roster, track expenses, and analyze your season.
            </p>
          </div>
          <div className="space-y-1.5 text-left">
            {[
              "Add a player named Alex Johnson, jersey #7",
              "Set our budget to $5,000",
              "Log a $200 equipment expense",
            ].map((suggestion) => (
              <div key={suggestion} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">&ldquo;{suggestion}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
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
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
