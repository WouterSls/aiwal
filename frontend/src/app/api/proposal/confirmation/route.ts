let pendingResolve: (() => void) | null = null;

function awaitConfirmation(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingResolve = null;
      resolve(false);
    }, timeoutMs);

    pendingResolve = () => {
      clearTimeout(timer);
      pendingResolve = null;
      resolve(true);
    };
  });
}

export async function GET() {
  const confirmed = await awaitConfirmation(15_000);
  return new Response(null, { status: confirmed ? 200 : 408 });
}

export async function POST() {
  pendingResolve?.();
  return new Response(null, { status: 201 });
}
