"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 border-t border-black p-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Message Aiwal..."
        className="flex-1 resize-none border border-black px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
        style={{ minHeight: "38px", maxHeight: "120px" }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="border border-black bg-black px-4 py-2 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
