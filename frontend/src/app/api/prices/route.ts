import fs from "fs";
import path from "path";

const UNISWAP_API_URL = process.env.UNISWAP_API_URL!;
const UNISWAP_API_KEY = process.env.UNISWAP_API_KEY!;
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

const STABLECOIN_ADDRESSES = new Set([
  USDC_ADDRESS,
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
]);

const decimalsMap: Map<string, number> = (() => {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "../resources/8453-tokens.json"),
    "utf-8"
  );
  const list: { tokens: { address: string; decimals: number }[] } = JSON.parse(raw);
  return new Map(list.tokens.map((t) => [t.address.toLowerCase(), t.decimals]));
})();

async function fetchUniswapPrice(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${UNISWAP_API_URL}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": UNISWAP_API_KEY,
      },
      body: JSON.stringify({
        tokenIn: USDC_ADDRESS,
        tokenOut: address,
        tokenInChainId: 8453,
        tokenOutChainId: 8453,
        amount: "1000000",
        type: "EXACT_INPUT",
        swapper: "0x0000000000000000000000000000000000000000",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Uniswap quote failed for ${address}: ${res.status} ${body}`);
      return null;
    }

    const json = await res.json();

    if (json.quote?.quoteDecimals) {
      const price = 1 / parseFloat(json.quote.quoteDecimals);
      return price.toFixed(6);
    }

    const rawAmount = json.quote?.output?.amount;
    if (!rawAmount) {
      console.error(`No quote amount in response for ${address}:`, json);
      return null;
    }

    const decimals = decimalsMap.get(address) ?? 18;
    const normalized = Number(BigInt(rawAmount)) / 10 ** decimals;
    const price = 1 / normalized;
    return price.toFixed(6);
  } catch (err) {
    console.error(`Failed to fetch price for ${address}:`, err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("addresses");
  if (!raw) return Response.json({ error: "addresses required" }, { status: 400 });

  const addresses = raw.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
  if (addresses.length === 0) return Response.json({ error: "addresses required" }, { status: 400 });

  const result: Record<string, string> = {};

  for (const address of addresses) {
    if (STABLECOIN_ADDRESSES.has(address)) {
      result[address] = "1.00";
    }
  }

  const nonStable = addresses.filter((a) => !STABLECOIN_ADDRESSES.has(a));

  for (let i = 0; i < nonStable.length; i += 3) {
    const batch = nonStable.slice(i, i + 3);
    const [results] = await Promise.all([
      Promise.allSettled(batch.map((address) => fetchUniswapPrice(address).then((price) => ({ address, price })))),
      i + 3 < nonStable.length ? new Promise((r) => setTimeout(r, 1000)) : Promise.resolve(),
    ]);
    for (const outcome of results) {
      if (outcome.status === "fulfilled" && outcome.value.price !== null) {
        result[outcome.value.address] = outcome.value.price;
      }
    }
  }

  return Response.json(result);
}
