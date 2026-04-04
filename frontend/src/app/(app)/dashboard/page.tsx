"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getWalletAccounts, onEvent } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { delegate } from "@/hooks/use-delegation";
import { parseAgentResponse, TradingStrategy } from "@/lib/claude";
import { buildSystemPrompt, TradePreset } from "@/lib/presets";
import { PortfolioView } from "@/components/portfolio-view";
import { ProposalEditor } from "@/components/proposal-editor";
import { ChatPanel, ChatMessage } from "@/components/chat-panel";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ProposalsHistory } from "@/components/proposals-history";
import { toast } from "sonner";

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState<TradingStrategy | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [preset, setPreset] = useState<TradePreset | null>(null);

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const accounts = getWalletAccounts(dynamicClient);
  const address = accounts[0]?.address;
  const checkedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !accounts.length) {
      router.push("/");
    }
  }, [mounted, accounts.length, router]);

  useEffect(() => {
    if (!mounted || !address || checkedRef.current) return;
    checkedRef.current = true;

    async function checkUserProfile() {
      try {
        const res = await fetch(`/api/users?walletAddress=${address}`, {
          headers: { Authorization: `Bearer ${dynamicClient.token}` },
        });
        if (res.status === 404) {
          router.replace("/onboard");
          return;
        }
        const user = await res.json();
        setPreset(user.preset as TradePreset);
        setAuthorized(true);
      } catch (error: unknown) {
        let errorMessage = error instanceof Error ? error.message : "Unknown";
        if (errorMessage.includes("Failed to execute")) {
          errorMessage = "Internal Server Error";
        }

        toast.error("Error Checking User profile", {
          description: errorMessage,
        });
      }
    }

    checkUserProfile();
  }, [mounted, address, router]);

  useEffect(() => {
    const offLogout = onEvent(
      { event: "logout", listener: () => router.push("/") },
      dynamicClient,
    );
    return offLogout;
  }, [router]);

  function buildCurrentSystemPrompt(): string | null {
    if (!preset || !address) return null;
    const portfolio =
      queryClient.getQueryData<{ symbol: string; balance: string }[]>([
        "portfolio",
        address,
      ]) ?? [];
    const prices =
      queryClient.getQueryData<Record<string, string>>(["prices"]) ?? {};
    const orders =
      queryClient.getQueryData<
        {
          id: string;
          type: string;
          token_in: string;
          token_out: string;
          amount_in: string;
          status: string;
        }[]
      >(["orders"]) ?? [];

    return buildSystemPrompt(preset, address, portfolio, prices, orders);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (loading) return;

      const system = buildCurrentSystemPrompt();
      if (!system) return;

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${dynamicClient.token}`,
          },
          body: JSON.stringify({
            system,
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

        const { text: responseText, strategy } = parseAgentResponse(full);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: responseText,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent(null);

        if (strategy) {
          setActiveProposal(strategy);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, messages, preset, address],
  );

  async function handleConfirm() {
    if (!activeProposal) return;

    setConfirmPending(true);
    try {
      const token = dynamicClient.token;
      await Promise.all([
        delegate(),
        fetch("/api/proposal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...activeProposal,
            wallet_address: getWalletAccounts(dynamicClient)[0]?.address,
          }),
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown";
      toast.error("Error Submitting Propsal", { description: errorMessage });
    } finally {
      setConfirmPending(false);
      setConfirmOpen(false);
      setActiveProposal(null);
      const doneMsg: ChatMessage = {
        role: "assistant",
        content: "Order submitted. Starting fresh — what's next?",
      };
      setMessages([doneMsg]);
      setTimeout(() => setMessages([]), 2500);
    }
  }

  function handleCancelProposal() {
    const rejectMsg: ChatMessage = {
      role: "assistant",
      content: "No worries — proposal rejected. Starting fresh, what's next?",
    };
    setMessages([rejectMsg]);
    setActiveProposal(null);
    setTimeout(() => setMessages([]), 2500);
  }

  if (!mounted || !accounts.length || !authorized) return null;

  return (
    <>
      <div className="flex h-[calc(100vh-65px)] overflow-hidden border-b border-black pt-4">
        <div className="w-1/2 overflow-hidden border-r border-black">
          {activeProposal ? (
            <ProposalEditor
              strategy={activeProposal}
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
          strategy={activeProposal}
          open={confirmOpen}
          pending={confirmPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
