"use client";

import { useState } from "react";

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

function orderDescription(
  order: Order,
  tokenIn: string,
  tokenOut: string,
): string {
  if (order.type === "send") {
    return `send ${order.amount_in} ${tokenIn} → ${order.to ?? "—"}`;
  }
  if (order.type === "limit_order") {
    return `limit ${tokenIn} → ${tokenOut} @ $${order.trading_price_usd ?? "—"}`;
  }
  return `swap ${tokenIn} → ${tokenOut}`;
}

function OrderRow({
  order,
  tokenIn,
  tokenOut,
}: {
  order: Order;
  tokenIn: string;
  tokenOut: string;
}) {
  return (
    <tr className="border-b border-black/10 text-xs">
      <td className="py-2 pr-6 uppercase tracking-widest text-black/50">
        {order.type.replace("_", " ")}
      </td>
      <td className="py-2 pr-6 font-medium">
        {orderDescription(order, tokenIn, tokenOut)}
      </td>
      <td className="py-2 pr-6">{order.amount_in}</td>
      {order.type === "swap" && (
        <td className="py-2 pr-6 text-black/50">
          {order.expected_out ?? "—"}
          {order.slippage_tolerance ? ` / ${order.slippage_tolerance}% slip` : ""}
        </td>
      )}
      {order.type === "limit_order" && (
        <td className="py-2 pr-6 text-black/50">
          ${order.trading_price_usd ?? "—"}
          {order.slippage_tolerance ? ` / ${order.slippage_tolerance}% slip` : ""}
        </td>
      )}
      {order.type === "send" && <td className="py-2 pr-6" />}
      <td className="py-2 pr-6 uppercase tracking-widest text-black/50">
        {order.status}
      </td>
      <td className="py-2 pr-6 text-black/40">
        {new Date(order.created_at).toLocaleString()}
      </td>
      <td className="py-2">
        {order.confirmation_hash && (
          <a
            href={`https://basescan.org/tx/${order.confirmation_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-black/40 hover:text-black"
          >
            {order.confirmation_hash.slice(0, 8)}...
          </a>
        )}
      </td>
    </tr>
  );
}

export function ProposalHistoryItem({ proposal }: { proposal: Proposal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-black">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-4 flex items-start justify-between text-left gap-6"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-4">
            <span className="text-xs font-bold uppercase tracking-widest">
              {proposal.title}
            </span>
            <span className="text-xs uppercase tracking-widest text-black/40">
              {proposal.token_in} → {proposal.token_out}
            </span>
          </div>
          <p className="mt-1 text-xs text-black/50 leading-relaxed line-clamp-1">
            {proposal.reasoning}
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-xs uppercase tracking-widest text-black/40">
            {proposal.status}
          </span>
          <span className="text-xs text-black/30">
            {proposal.created_at
              ? new Date(proposal.created_at).toLocaleString()
              : "—"}
          </span>
          <span className="text-xs text-black/30">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="pb-4">
          {proposal.orders.length === 0 ? (
            <p className="text-xs uppercase tracking-widest text-black/30 py-2">
              No orders
            </p>
          ) : (
            <table className="w-full">
              <tbody>
                {proposal.orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    tokenIn={proposal.token_in}
                    tokenOut={proposal.token_out}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
