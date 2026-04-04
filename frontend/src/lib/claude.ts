// order
export interface Trade {
  type: "send" | "swap" | "limit_order";
  amount_in: string;
  expected_out: string | null;
  slippage_tolerance: string | null;
  trading_price_usd: number | null;
  to: string | null;
}

// proposal
export interface TradingStrategy {
  title: string;
  reasoning: string;
  token_in: string;
  token_out: string;
  trades: Trade[];
}

export interface ParsedAgentResponse {
  text: string;
  strategy: TradingStrategy | null;
}

export function parseAgentResponse(content: string): ParsedAgentResponse {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    return { text: content, strategy: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const valid =
      parsed.title &&
      parsed.token_in &&
      parsed.token_out &&
      Array.isArray(parsed.trades) &&
      parsed.trades.length > 0 &&
      parsed.trades.every((t: Trade) => t.type && t.amount_in);

    if (!valid) {
      return { text: content, strategy: null };
    }

    const text = content.replace(/```json[\s\S]*?```/, "").trim();
    return { text, strategy: parsed as TradingStrategy };
  } catch {
    return { text: content, strategy: null };
  }
}
