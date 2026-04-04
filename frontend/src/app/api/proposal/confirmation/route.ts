export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("wallet_address");
  if (!walletAddress) return new Response(null, { status: 400 });
  return new Response(null, { status: 201 });
}
