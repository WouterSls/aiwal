const BACKEND_URL = process.env.BACKEND_URL ?? "https://trader.senter.be";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");
  const url = new URL(`${BACKEND_URL}/api/proposals`);
  if (walletAddress) url.searchParams.set("walletAddress", walletAddress);
  const res = await fetch(url.toString());
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
