"use client";

import { useCallback, useState } from "react";
import type { ChatMessage, SSEEvent } from "@/types/agent";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export function useChat(teamId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<MessageParam[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const newApiMessages: MessageParam[] = [
        ...apiMessages,
        { role: "user", content: text },
      ];
      setApiMessages(newApiMessages);

      setIsStreaming(true);
      setStreamingContent("");
      setActiveToolName(null);

      let accumulatedText = "";

      try {
        console.log("[chat] → POST /api/agent", { teamId, messages: newApiMessages.length });
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newApiMessages, teamId }),
        });

        console.log("[chat] ← HTTP", response.status);
        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              if (event.type !== "text") console.log("[chat] SSE event:", event);

              if (event.type === "text") {
                accumulatedText += event.delta;
                setStreamingContent(accumulatedText);
              } else if (event.type === "tool_start") {
                setActiveToolName(event.name);
              } else if (event.type === "tool_result") {
                setActiveToolName(null);
                // Dispatch refresh event so dashboard updates
                window.dispatchEvent(new CustomEvent("dashboard:refresh"));
              } else if (event.type === "done") {
                // Finalize the assistant message
                if (accumulatedText) {
                  const assistantMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: accumulatedText,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setApiMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: accumulatedText },
                  ]);
                }
                setStreamingContent("");
                setActiveToolName(null);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              console.warn("[chat] Failed to parse SSE line:", line, parseErr);
            }
          }
        }
      } catch (err) {
        console.error("[chat] ❌ Error:", err);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setActiveToolName(null);
      }
    },
    [apiMessages, isStreaming, teamId]
  );

  return { messages, streamingContent, activeToolName, isStreaming, sendMessage };
}
