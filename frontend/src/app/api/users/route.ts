const BACKEND_URL = process.env.BACKEND_URL ?? "https://tader.senter.be";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const res = await fetch(`${BACKEND_URL}/api/users?${searchParams}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
