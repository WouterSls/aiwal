const BACKEND_URL = process.env.BACKEND_URL ?? "https://tader.senter.be";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const res = await fetch(`${BACKEND_URL}/api/orders?${searchParams}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
