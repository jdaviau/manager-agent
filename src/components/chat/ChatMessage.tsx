"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/agent";

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex items-end shrink-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">
            🏆
          </div>
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-base",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-white border border-border/60 shadow-xs text-foreground rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed
            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
            [&_table]:text-xs [&_th]:font-semibold [&_th]:text-left [&_th]:pb-1
            [&_td]:py-0.5 [&_tr]:border-b [&_tr:last-child]:border-0
            [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
            [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        <p
          className={cn(
            "text-[10px] mt-1.5 select-none",
            isUser ? "text-primary-foreground/50 text-right" : "text-muted-foreground/70"
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
