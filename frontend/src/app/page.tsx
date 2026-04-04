"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onEvent } from "@dynamic-labs-sdk/client";
import { ConnectButton } from "@/components/connect-button";
import { dynamicClient } from "@/lib/dynamic";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    return onEvent(
      {
        event: "userChanged",
        listener: ({ user }) => {
          if (user) {
            const hasPreset = false; // TODO: check preset from user profile
            router.push(hasPreset ? "/dashboard" : "/onboard");
          }
        },
      },
      dynamicClient
    );
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-8xl font-black uppercase tracking-tight">
          AIWAL
        </h1>
        <p className="text-xl font-light lowercase tracking-widest">
          next generation of wallet automation
        </p>
        <ConnectButton />
      </div>
    </main>
  );
}
