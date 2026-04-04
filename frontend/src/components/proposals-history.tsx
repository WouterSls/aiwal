"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { ProposalHistoryItem } from "@/components/proposal-history-item";

interface Order {
  id: string;
  type: "swap" | "limit_order" | "send";
  amount_in: string;
  expected_out?: string;
  to?: string;
  slippage_tolerance?: string;
  trading_price_usd?: number;
  confirmation_hash?: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id: string;
  wallet_address: string;
  title: string;
  reasoning: string;
  token_in: string;
  token_out: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  orders: Order[];
}

async function fetchProposals(): Promise<Proposal[]> {
  const walletAddress = getWalletAccounts(dynamicClient)[0]?.address;
  const url = new URL("/api/proposals", window.location.origin);
  if (walletAddress) url.searchParams.set("walletAddress", walletAddress);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${dynamicClient.token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch proposals");
  const { proposals } = await res.json();
  return proposals ?? [];
}

export function ProposalsHistory() {
  const { data: proposals } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-black/50">
        Proposals History
      </h2>
      {!proposals || proposals.length === 0 ? (
        <div className="py-12 text-center text-sm uppercase tracking-widest text-black/30">
          No proposals yet
        </div>
      ) : (
        <div className="border-t border-black">
          {proposals.map((proposal) => (
            <ProposalHistoryItem key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
