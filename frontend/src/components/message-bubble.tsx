interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-black text-white"
            : "border border-black/20 bg-white text-black"
        }`}
      >
        {content}
        {streaming && (
          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
        )}
      </div>
    </div>
  );
}
