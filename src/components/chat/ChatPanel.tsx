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
    <div className="flex flex-col h-full border-r bg-background">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Coach Assistant</h2>
        <p className="text-xs text-muted-foreground">Ask me anything about your team</p>
      </div>
      <ChatMessages
        messages={messages}
        streamingContent={streamingContent}
        activeToolName={activeToolName}
      />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
