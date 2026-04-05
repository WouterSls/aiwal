# Prices API Route Spec

> Aiwal Frontend · Next.js · MVP · April 2026

## Purpose

Fetch real-time token prices in USD from the Uniswap Quoter API for a given set of token contract addresses. Stablecoins are hardcoded to `1.00` to avoid unnecessary API calls.

## Route

```
GET /api/prices?addresses=0x...,0x...
```

### Query Parameters

| Param       | Required | Description                                      |
| ----------- | -------- | ------------------------------------------------ |
| `addresses` | yes      | Comma-separated list of Base token contract addresses |

### Response

```typescript
{
  [address: string]: string  // lowercase address → USD price string
}
```

Example:
```json
{
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "1.00",
  "0x4200000000000000000000000000000000000006": "3241.87"
}
```

Returns `400` if `addresses` param is missing or empty.

## Stablecoin Hardcoding

The following Base mainnet addresses are hardcoded to `"1.00"` and never sent to Uniswap:

| Symbol | Address |
|--------|---------|
| USDC   | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` |
| USDbC  | `0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca` |
| USDT   | `0xfde4c96c8593536e31f229ea8f37b2ada2699bb2` |
| DAI    | `0x50c5725949a6f0c72e6c4a641f24049a917db0cb` |

## Uniswap Quoter API

Non-stablecoin tokens are priced by quoting `1 USDC → token` and computing `1 / amountOut` (normalized by token decimals).

```
GET {UNISWAP_API_URL}/quote
  ?tokenInAddress=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913   (USDC)
  &tokenOutAddress={address}
  &tokenInChainId=8453
  &tokenOutChainId=8453
  &amount=1000000
  &type=EXACT_INPUT
```

Parse `routing: "DUTCH_LIMIT" | "CLASSIC"` — price is in `quote.quoteDecimals` (already decimal-normalized string).

Price formula: `1 / parseFloat(quoteDecimals)`.

## Implementation

```typescript
// frontend/src/app/api/prices/route.ts

const UNISWAP_API_URL = process.env.UNISWAP_API_URL!;
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

const STABLECOIN_ADDRESSES = new Set([
  USDC_ADDRESS,
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
]);

async function fetchUniswapPrice(address: string): Promise<string | null>

export async function GET(request: Request): Promise<Response>
```

`fetchUniswapPrice` calls the Uniswap quote endpoint and returns the price string, or `null` on failure (logged, omitted from response).

All non-stablecoin addresses are fetched in parallel via `Promise.allSettled`.

## Environment Variables

```
UNISWAP_API_URL=   # Uniswap Quoter API base URL (e.g. https://trade-api.gateway.uniswap.org/v1)
```

## Consumer Updates Required

Switching from symbol-keyed to address-keyed prices requires updates to two consumers:

### 1. `portfolio/route.ts`

Add `address` field to each returned token so consumers can build the prices query:

```typescript
// current
{ symbol: string; balance: string; logoURI?: string }

// updated
{ symbol: string; address: string; balance: string; logoURI?: string }
```

ETH has no contract address — use the canonical WETH address on Base:
`0x4200000000000000000000000000000000000006`

### 2. `portfolio-view.tsx`

- Update `PortfolioToken` interface to include `address: string`
- Pass portfolio token addresses into the prices query key and URL:
  ```typescript
  const addresses = portfolio?.map((t) => t.address) ?? [];

  useQuery({
    queryKey: ["prices", addresses],
    queryFn: () => fetch(`/api/prices?addresses=${addresses.join(",")}`),
    enabled: addresses.length > 0,
  })
  ```
- Look up prices by `token.address` instead of `token.symbol`

### 3. `presets.ts` + `dashboard/page.tsx`

- Update `PriceData` type to `Record<string, string>` keyed by address (no interface change needed — just semantics)
- In `buildSystemPrompt`, the `portfolio` array now has `address`, so price lookup becomes `prices[t.address]`
- The `formattedPrices` block in the system prompt should resolve symbol via `portfolio` for readability, or simply omit it (prices are already shown inline per token)
