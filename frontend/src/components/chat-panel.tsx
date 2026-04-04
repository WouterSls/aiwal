"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/message-bubble";
import { ChatInput } from "@/components/chat-input";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  streamingContent: string | null;
  onSend: (message: string) => void;
  loading: boolean;
}

export function ChatPanel({
  messages,
  streamingContent,
  onSend,
  loading,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messages.length && !streamingContent) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black px-6 py-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-black/50">
          Agent
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex h-full items-center justify-center text-sm text-black/30 uppercase tracking-widest">
            Start a conversation
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {streamingContent !== null && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            streaming
          />
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  );
}
