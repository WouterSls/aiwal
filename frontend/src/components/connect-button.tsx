"use client";

import { useState } from "react";
import { connectAndVerifyWithWalletProvider } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";

export function ConnectButton() {
  const [connecting, setConnecting] = useState(false);

  async function handleClick() {
    setConnecting(true);
    try {
      await connectAndVerifyWithWalletProvider(
        { walletProviderKey: "metamaskevm" },
        dynamicClient
      );
    } catch {
      setConnecting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className="border border-black bg-transparent px-10 py-3 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {connecting ? "Connecting..." : "Connect"}
    </button>
  );
}
