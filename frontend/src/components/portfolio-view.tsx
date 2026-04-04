"use client";

import { useQuery } from "@tanstack/react-query";
import { TokenRow } from "@/components/token-row";
interface PortfolioToken {
  symbol: string;
  balance: string;
  icon?: string;
}

interface PriceData {
  [symbol: string]: string;
}

async function fetchPortfolio(): Promise<PortfolioToken[]> {
  return [
    { symbol: "ETH", balance: "1.842" },
    { symbol: "USDC", balance: "3420.00" },
    { symbol: "WBTC", balance: "0.045" },
  ];
}

async function fetchPrices(): Promise<PriceData> {
  return {
    ETH: "3180.50",
    USDC: "1.00",
    WBTC: "68200.00",
  };
}

export function PortfolioView() {
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio,
    refetchInterval: 30_000,
  });

  const { data: prices } = useQuery({
    queryKey: ["prices"],
    queryFn: fetchPrices,
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
              usdValue={
                prices?.[token.symbol]
                  ? (
                      parseFloat(token.balance) *
                      parseFloat(prices[token.symbol])
                    ).toFixed(2)
                  : "—"
              }
              icon={token.icon}
            />
          ))
        )}
      </div>
    </div>
  );
}
