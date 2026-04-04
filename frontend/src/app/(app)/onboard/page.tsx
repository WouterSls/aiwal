"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { PresetCard } from "@/components/preset-card";

type Preset = "institutional" | "degen";

export default function OnboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [loading, setLoading] = useState(false);

  const accounts = getWalletAccounts(dynamicClient);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !accounts.length) {
      router.push("/");
    }
  }, [mounted, accounts.length, router]);

  useEffect(() => {
    if (!mounted || !accounts.length) return;

    async function checkExistingUser() {
      const address = accounts[0].address;
      const res = await fetch(`/api/users?walletAddress=${address}`);
      if (res.ok) {
        router.replace("/dashboard");
        return;
      }
      setWalletAddress(address);
    }

    checkExistingUser();
  }, [mounted, accounts, router]);

  async function handleContinue() {
    if (!selectedPreset || !walletAddress) return;
    setLoading(true);

    await fetch(`/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, preset: selectedPreset }),
    });

    router.push("/dashboard");
  }

  if (!mounted || !accounts.length || !walletAddress) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 md:px-10">
      <div className="flex w-full max-w-2xl flex-col gap-10">
        <h1 className="text-center text-2xl font-black uppercase tracking-widest">
          Choose your trading style
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <PresetCard
            preset="degen"
            selected={selectedPreset === "degen"}
            onSelect={() => setSelectedPreset("degen")}
          />
          <PresetCard
            preset="institutional"
            selected={selectedPreset === "institutional"}
            onSelect={() => setSelectedPreset("institutional")}
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedPreset || loading}
            className="border border-black px-10 py-3 text-sm font-medium uppercase tracking-widest transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            {loading ? "..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
