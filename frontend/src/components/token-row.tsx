import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        <Avatar>
          <AvatarImage src={icon} alt={symbol} />
          <AvatarFallback className="text-xs font-bold border border-black bg-transparent">
            {symbol.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
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
