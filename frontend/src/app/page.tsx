"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  onEvent,
  getWalletAccounts,
  detectOAuthRedirect,
  completeSocialAuthentication,
} from "@dynamic-labs-sdk/client";
import {
  getChainsMissingWaasWalletAccounts,
  createWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";
import { API_URL } from "@/lib/api";
import { ConnectButton } from "@/components/connect-button";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    return onEvent(
      {
        event: "userChanged",
        listener: async ({ user }) => {
          if (!user) return;
          try {
            const missing =
              await getChainsMissingWaasWalletAccounts(dynamicClient);
            await createWaasWalletAccounts({ chains: missing }, dynamicClient);
            const accounts = await getWalletAccounts(dynamicClient);
            const walletAddress = accounts[0].address;

            const res = await fetch(
              `${API_URL}/api/presets?userId=${user.userId}&walletAddress=${walletAddress}`,
            );
            if (res.ok) {
              router.push("/dashboard");
            } else {
              router.push("/onboard");
            }
          } catch {
            toast.error("Something went wrong. Please reconnect.");
          }
        },
      },
      dynamicClient,
    );
  }, [router]);

  useEffect(() => {
    const url = new URL(window.location.href);
    detectOAuthRedirect({ url }, dynamicClient).then((isReturning) => {
      if (isReturning) completeSocialAuthentication({ url }, dynamicClient);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex min-h-[80svh] items-center justify-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 md:px-10">
          <h1 className="text-8xl font-black uppercase tracking-tight">
            AIWAL
          </h1>
          <p className="text-xl font-light lowercase tracking-widest">
            next generation of wallet automation
          </p>
          <ConnectButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
