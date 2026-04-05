import { useEffect } from "react";
import { toast } from "sonner";
import { ConfirmationPayload } from "./confirmations-store";

export function useConfirmations(walletAddress: string | undefined): void {
  useEffect(() => {
    if (!walletAddress) return;

    const id = setInterval(async () => {
      const res = await fetch(`/api/confirmations?walletAddress=${walletAddress}`);
      if (!res.ok) return;
      const confirmations: ConfirmationPayload[] = await res.json();

      for (const c of confirmations) {
        if (c.status === 'completed' && c.confirmationHash) {
          const hash = c.confirmationHash;
          toast.success("Transaction confirmed", {
            description: (
              <a
                href={`https://basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tx Hash: {hash.slice(0, 6)}...{hash.slice(-6)}
              </a>
            ),
          });
        } else if (c.status === 'completed') {
          toast.success("Transaction confirmed");
        } else {
          toast.error("Transaction failed");
        }
      }
    }, 3000);

    return () => clearInterval(id);
  }, [walletAddress]);
}
