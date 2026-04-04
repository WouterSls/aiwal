"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getWalletAccounts, onEvent } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { API_URL } from "@/lib/api";
import { parseAgentResponse, TransactionProposal } from "@/lib/claude";
import { PortfolioView } from "@/components/portfolio-view";
import { ProposalEditor } from "@/components/proposal-editor";
import { ChatPanel, ChatMessage } from "@/components/chat-panel";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ProposalsHistory } from "@/components/proposals-history";

const SYSTEM_PROMPT = `You are the Aiwal trading agent on Base L2.

## Response Rules

You MUST respond in one of these three formats:

### Format 1: Transaction Proposal
When the user wants to execute a trade, wrap your proposal in a \`\`\`json code block with this exact structure:

\`\`\`json
{
  "type": "swap" | "limit_order" | "stop_loss" | "take_profit",
  "action": "buy" | "sell",
  "token_in": "<symbol>",
  "token_out": "<symbol>",
  "amount_in": "<amount as string>",
  "expected_out": "<amount as string>",
  "slippage_tolerance": "<percentage as string>",
  "condition": "<price condition if limit/SL/TP, null for swap>",
  "reasoning": "<1-2 sentence explanation>"
}
\`\`\`

You may include conversational text before or after the JSON block.

### Format 2: Informational Response
When the user asks about market conditions, portfolio, strategy, or anything that doesn't require a trade.

### Format 3: Clarifying Question
When the user's intent is ambiguous or missing critical details.

## Constraints
- NEVER propose a trade for more than the user's available balance
- ALWAYS include reasoning for any proposal
- All amounts must be strings to preserve decimal precision`;

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProposal, setActiveProposal] =
    useState<TransactionProposal | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const accounts = getWalletAccounts(dynamicClient);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !accounts.length) {
      router.push("/");
    }
  }, [mounted, accounts.length, router]);

  useEffect(() => {
    const offLogout = onEvent(
      { event: "logout", listener: () => router.push("/") },
      dynamicClient,
    );
    return offLogout;
  }, [router]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (loading) return;

      const userMsg: ChatMessage = { role: "user", content: text };
      const nextMessages = [...messages, userMsg].slice(-25);
      setMessages(nextMessages);
      setLoading(true);
      setStreamingContent("");

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: SYSTEM_PROMPT,
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Agent unavailable");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamingContent(full);
        }

        const { text, proposal } = parseAgentResponse(full);
        const assistantMsg: ChatMessage = { role: "assistant", content: text };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent(null);

        if (proposal) {
          setActiveProposal(proposal);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: "Agent unavailable. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStreamingContent(null);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  async function handleConfirm() {
    if (!activeProposal) return;
    try {
      await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeProposal),
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } finally {
      setConfirmOpen(false);
      setActiveProposal(null);
    }
  }

  function handleCancelProposal() {
    setActiveProposal(null);
  }

  if (!mounted || !accounts.length) return null;

  return (
    <>
      <div className="flex h-[calc(100vh-65px)] overflow-hidden border-b border-black pt-4">
        <div className="w-1/2 overflow-hidden border-r border-black">
          {activeProposal ? (
            <ProposalEditor
              proposal={activeProposal}
              onChange={setActiveProposal}
              onConfirm={() => setConfirmOpen(true)}
              onCancel={handleCancelProposal}
            />
          ) : (
            <PortfolioView />
          )}
        </div>
        <div className="w-1/2 overflow-hidden">
          <ChatPanel
            messages={messages}
            streamingContent={streamingContent}
            onSend={sendMessage}
            loading={loading}
          />
        </div>
      </div>

      <ProposalsHistory />

      {activeProposal && (
        <ConfirmationModal
          proposal={activeProposal}
          open={confirmOpen}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
