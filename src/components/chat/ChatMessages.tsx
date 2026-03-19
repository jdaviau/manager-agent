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
  isStreaming: boolean;
}

const SUGGESTIONS = [
  { icon: "👤", text: "Add a player named Alex Johnson, jersey #7" },
  { icon: "💰", text: "Set our budget to $5,000 for this season" },
  { icon: "🧾", text: "Log a $200 equipment expense for training bibs" },
  { icon: "📅", text: "Add a game vs Riverside FC next Friday" },
];

export function ChatMessages({ messages, streamingContent, activeToolName, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, activeToolName]);

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-xl mx-auto">
            🏆
          </div>
          <p className="font-semibold text-sm">Welcome, Team Manager!</p>
          <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
            Ask me anything about your team or try one of these:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
          {SUGGESTIONS.map((s) => (
            <div
              key={s.text}
              className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-white/80 px-3 py-2.5 shadow-xs cursor-default"
            >
              <span className="text-base leading-none mt-0.5">{s.icon}</span>
              <p className="text-xs text-muted-foreground leading-snug">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/5">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Tool call in progress */}
      {activeToolName && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 self-end">
            🏆
          </div>
          <ToolCallIndicator toolName={activeToolName} />
        </div>
      )}

      {/* Streaming AI response */}
      {streamingContent && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 self-end">
            🏆
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-white border border-border/60 shadow-xs text-foreground">
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed
              [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
              [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
              [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator: streaming started but no content or tool yet */}
      {isStreaming && !streamingContent && !activeToolName && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 self-end">
            🏆
          </div>
          <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-border/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
