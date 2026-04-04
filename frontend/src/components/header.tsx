"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWalletAccounts, onEvent, logout } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { ConnectButton } from "@/components/connect-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-black transition-opacity hover:opacity-60"
      aria-label="Copy address"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  );
}

export function Header() {
  const [address, setAddress] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const accounts = getWalletAccounts(dynamicClient);
    setAddress(accounts[0]?.address ?? null);

    const offWallets = onEvent(
      {
        event: "walletAccountsChanged",
        listener: ({ walletAccounts }) => {
          setAddress(walletAccounts[0]?.address ?? null);
        },
      },
      dynamicClient,
    );

    const offLogout = onEvent(
      {
        event: "logout",
        listener: () => {
          setAddress(null);
          setDisconnecting(false);
        },
      },
      dynamicClient,
    );

    return () => {
      offWallets();
      offLogout();
    };
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-black bg-white py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="text-xl font-black uppercase tracking-tight">
          Aiwal
        </Link>
        {address ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger className="cursor-default text-sm font-normal tracking-widest">
                  {truncateAddress(address)}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-mono text-xs">{address}</span>
                </TooltipContent>
              </Tooltip>
              <CopyAddressButton address={address} />
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="border border-black bg-transparent px-6 py-3 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : (
          <ConnectButton />
        )}
      </div>
    </header>
  );
}
