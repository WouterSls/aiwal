"use client";

import { useQuery } from "@tanstack/react-query";
import { ProposalRow } from "@/components/proposal-row";

interface Order {
  id: string;
  type: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  status: "confirmed" | "completed" | "failed";
  created_at: string;
  tx_hash?: string;
}

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`/api/orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  const { orders } = await res.json();
  return orders ?? [];
}

export function ProposalsHistory() {
  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-black/50">
        Proposals History
      </h2>
      {!orders || orders.length === 0 ? (
        <div className="py-12 text-center text-sm uppercase tracking-widest text-black/30">
          No proposals yet
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-black text-left">
              {["Type", "Pair", "Amount", "Status", "Time", "Tx"].map((h) => (
                <th
                  key={h}
                  className="pb-3 pr-4 text-xs font-medium uppercase tracking-widest text-black/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <ProposalRow
                key={order.id}
                type={order.type}
                token_in={order.token_in}
                token_out={order.token_out}
                amount_in={order.amount_in}
                status={order.status}
                timestamp={order.created_at}
                tx_hash={order.tx_hash}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
