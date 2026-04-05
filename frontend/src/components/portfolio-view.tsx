"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { TokenRow } from "@/components/token-row";

interface PortfolioToken {
  symbol: string;
  address: string;
  balance: string;
  logoURI?: string;
}

interface PriceData {
  [address: string]: string;
}

export function PortfolioView() {
  const accounts = getWalletAccounts(dynamicClient);
  const address = accounts[0]?.address;

  const { data: portfolio } = useQuery<PortfolioToken[]>({
    queryKey: ["portfolio", address],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio?address=${address}`, {
        headers: { Authorization: `Bearer ${dynamicClient.token}` },
      });
      return res.json();
    },
    enabled: !!address,
    refetchInterval: 30_000,
  });

  const addresses = portfolio?.map((t) => t.address) ?? [];

  const { data: prices } = useQuery<PriceData>({
    queryKey: ["prices", addresses],
    queryFn: async () => {
      const res = await fetch(`/api/prices?addresses=${addresses.join(",")}`, {
        headers: { Authorization: `Bearer ${dynamicClient.token}` },
      });
      return res.json();
    },
    enabled: addresses.length > 0,
    refetchInterval: 30_000,
  });

  const tokens = portfolio ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black px-6 py-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-black/50">
          Portfolio
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {tokens.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-black/30 uppercase tracking-widest">
            No tokens
          </div>
        ) : (
          tokens.map((token) => (
            <TokenRow
              key={token.symbol}
              symbol={token.symbol}
              balance={token.balance}
              icon={token.logoURI}
              usdValue={
                prices?.[token.address]
                  ? (
                      parseFloat(token.balance) *
                      parseFloat(prices[token.address])
                    ).toFixed(2)
                  : "—"
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
