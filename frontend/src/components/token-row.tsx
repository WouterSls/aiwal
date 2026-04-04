interface TokenRowProps {
  symbol: string;
  balance: string;
  usdValue: string;
  icon?: string;
}

export function TokenRow({ symbol, balance, usdValue, icon }: TokenRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3">
      <div className="flex items-center gap-3">
        {icon ? (
          <img src={icon} alt={symbol} className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black text-xs font-bold">
            {symbol.slice(0, 2)}
          </div>
        )}
        <span className="font-medium uppercase tracking-widest text-sm">
          {symbol}
        </span>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{balance}</div>
        <div className="text-xs text-black/50">${usdValue}</div>
      </div>
    </div>
  );
}
