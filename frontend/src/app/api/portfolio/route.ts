import fs from "fs";
import path from "path";

const ALCHEMY_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL!;

interface TokenListEntry {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface TokenList {
  tokens: TokenListEntry[];
}

function loadTokenMap(): Map<string, TokenListEntry> {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "../resources/8453-tokens.json"),
    "utf-8"
  );
  const list: TokenList = JSON.parse(raw);
  return new Map(list.tokens.map((t) => [t.address.toLowerCase(), t]));
}

async function rpcCall(method: string, params: unknown[]) {
  const res = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  return json.result;
}

function hexToDecimal(hex: string, decimals: number): string {
  const raw = BigInt(hex);
  if (raw === BigInt(0)) return "0";
  const factor = BigInt(10 ** decimals);
  const whole = raw / factor;
  const remainder = raw % factor;
  const fracStr = remainder.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address) return Response.json({ error: "address required" }, { status: 400 });

  const tokenMap = loadTokenMap();

  const [ethHex, erc20Result] = await Promise.all([
    rpcCall("eth_getBalance", [address, "latest"]),
    rpcCall("alchemy_getTokenBalances", [address, "erc20"]),
  ]);

  const tokens = [];

  const ethBalance = hexToDecimal(ethHex, 18);
  if (parseFloat(ethBalance) > 0) {
    tokens.push({ symbol: "ETH", balance: parseFloat(ethBalance).toFixed(6), logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" });
  }

  for (const { contractAddress, tokenBalance } of erc20Result.tokenBalances ?? []) {
    const entry = tokenMap.get(contractAddress.toLowerCase());
    if (!entry) continue;

    const balance = hexToDecimal(tokenBalance, entry.decimals);
    if (parseFloat(balance) === 0) continue;

    tokens.push({
      symbol: entry.symbol,
      balance: parseFloat(balance).toFixed(4),
      logoURI: entry.logoURI,
    });
  }

  return Response.json(tokens);
}
