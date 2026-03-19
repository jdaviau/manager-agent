"use client";

import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";

interface Props {
  teamId: string;
}

export function ChatPanel({ teamId }: Props) {
  const { messages, streamingContent, activeToolName, isStreaming, sendMessage } =
    useChat(teamId);

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
      <ChatMessages
        messages={messages}
        streamingContent={streamingContent}
        activeToolName={activeToolName}
        isStreaming={isStreaming}
      />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
