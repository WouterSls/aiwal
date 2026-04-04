"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWalletAccounts, onEvent, logout } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { ConnectButton } from "@/components/connect-button";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Header() {
  const [address, setAddress] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const accounts = getWalletAccounts(dynamicClient);
    setAddress(accounts[0]?.address ?? null);

    return onEvent(
      {
        event: "walletAccountsChanged",
        listener: ({ walletAccounts }) => {
          setAddress(walletAccounts[0]?.address ?? null);
        },
      },
      dynamicClient,
    );
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await logout(dynamicClient);
    } catch {
      setDisconnecting(false);
    }
  }

  return (
    <header className="top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-black bg-white px-6 py-4 md:px-10">
      <Link href="/" className="text-xl font-black uppercase tracking-tight">
        Aiwal
      </Link>
      {address ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-normal tracking-widest">
            {truncateAddress(address)}
          </span>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="border border-black bg-transparent px-6 py-2 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <ConnectButton />
      )}
    </header>
  );
}
