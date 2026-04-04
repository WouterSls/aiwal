import ReactMarkdown from "react-markdown";

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
        {isUser ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children }) => <code className="rounded bg-black/10 px-1 font-mono text-xs">{children}</code>,
              pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded bg-black/10 p-2 font-mono text-xs">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        {streaming && (
          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
        )}
      </div>
    </div>
  );
}
