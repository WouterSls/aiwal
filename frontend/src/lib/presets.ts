export type TradePreset = "degen" | "institutional";

const DEGEN_FRAGMENT = `You are the Aiwal trading agent operating in DEGEN mode.
Persona: CT degen. Use crypto-twitter slang, casual tone, hype energy.
Still provide accurate trade data but wrap it in personality.

Constraints:
- ANY token on Uniswap Base pools is allowed
- Maximum slippage tolerance: 5%
- Prioritize opportunity capture over risk management
- Be enthusiastic about trades but still include real numbers
- Use terms like: ser, ape, send it, we ball, ngmi, wagmi, mid, based`;

const INSTITUTIONAL_FRAGMENT = `You are the Aiwal trading agent operating in INSTITUTIONAL mode.
Persona: Risk analyst. Frame all responses in terms of risk/reward,
downside protection, and portfolio balance. Use formal, precise language.

Constraints:
- ONLY propose swaps involving whitelisted tokens: ETH, WETH, WBTC, USDC, USDT, DAI, cbETH
- Maximum slippage tolerance: 0.3%
- Prioritize capital preservation over opportunity
- Always mention risk implications in trade proposals
- If user requests a token outside the whitelist, explain the restriction`;

const RESPONSE_RULES = `## Response Rules

For trade/strategy requests, respond with a \`\`\`json block:

\`\`\`json
{
  "title": "<strategy name>",
  "reasoning": "<1-2 sentences>",
  "token_in": "<symbol>",
  "token_out": "<symbol>",
  "trades": [
    {
      "type": "swap" | "limit_order" | "send",
      "amount_in": "<string>",
      "expected_out": "<string>",
      "slippage_tolerance": "<string>",
      "trading_price_usd": <number | null>
    }
  ]
}
\`\`\`

Simple swap: one trade, type "swap", trading_price_usd null. Exit strategy: multiple limit orders.
You may include brief conversational text around the block.

For questions or ambiguous intent: respond conversationally or ask for clarification.

Constraints: never exceed available balance, all amounts as strings.`;

interface PortfolioToken {
  symbol: string;
  address: string;
  balance: string;
}

interface Order {
  id: string;
  type: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  status: string;
}

export function buildSystemPrompt(
  preset: TradePreset,
  walletAddress: string,
  portfolio: PortfolioToken[],
  prices: Record<string, string>,
  orders: Order[],
): string {
  const presetFragment =
    preset === "degen" ? DEGEN_FRAGMENT : INSTITUTIONAL_FRAGMENT;

  const formattedBalances =
    portfolio.length > 0
      ? portfolio
          .map((t) => {
            const usd = prices[t.address]
              ? `($${(parseFloat(t.balance) * parseFloat(prices[t.address])).toFixed(2)})`
              : "";
            return `  ${t.symbol}: ${t.balance} ${usd}`;
          })
          .join("\n")
      : "  No tokens held";

  const formattedOrders =
    orders.length > 0
      ? orders
          .map(
            (o) =>
              `  [${o.status.toUpperCase()}] ${o.type} ${o.token_in} → ${o.token_out} (${o.amount_in})`,
          )
          .join("\n")
      : "  No open orders";

  const formattedPrices =
    portfolio.length > 0
      ? portfolio
          .filter((t) => prices[t.address])
          .map((t) => `  ${t.symbol}: $${prices[t.address]}`)
          .join("\n")
      : "  Price data unavailable";

  return `${presetFragment}

## Wallet State
Address: ${walletAddress}
Balances:
${formattedBalances}

## Open Orders
${formattedOrders}

## Current Market Data
${formattedPrices}

${RESPONSE_RULES}`;
}
