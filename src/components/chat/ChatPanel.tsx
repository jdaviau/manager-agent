"use client";

import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

interface Props {
  teamId: string;
}

export function ChatPanel({ teamId }: Props) {
  const { messages, streamingContent, activeToolName, isStreaming, usageWarning, sendMessage } =
    useChat(teamId);
  const { usage, isAtLimit, isNearLimit, subscription } = useSubscription();

  // Use live subscription data; fall back to SSE warning if subscription not yet loaded
  const displayCount = usage.count > 0 ? usage.count : (usageWarning?.count ?? 0);
  const displayLimit = usage.limit > 0 ? usage.limit : (usageWarning?.limit ?? 0);
  const showUsageBar = displayCount > 0 && displayLimit > 0;

  const usageColor =
    isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-emerald-500";

  const resetDate = (() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  const limitResetDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : resetDate;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b bg-white flex items-center gap-2.5 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h2 className="font-semibold text-sm leading-tight">Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask me anything about your team</p>
        </div>
      </div>

      {/* Usage bar */}
      {showUsageBar && (
        <Link href="/billing" className="group block px-3 pt-2 pb-1 border-b bg-white">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span className="group-hover:text-foreground transition-colors">
              {displayCount} / {displayLimit} prompts this month
            </span>
            {isAtLimit && <span className="text-red-500 font-medium">Limit reached</span>}
            {isNearLimit && !isAtLimit && <span className="text-amber-500 font-medium">Near limit</span>}
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usageColor}`}
              style={{ width: `${Math.min((displayCount / displayLimit) * 100, 100)}%` }}
            />
          </div>
        </Link>
      )}

      <ChatMessages
        messages={messages}
        streamingContent={streamingContent}
        activeToolName={activeToolName}
        isStreaming={isStreaming}
      />
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        isAtLimit={isAtLimit}
        limitResetDate={limitResetDate}
      />
    </div>
  );
}
