"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn } from "@dynamic-labs-sdk/client";
import { dynamicClient } from "@/lib/dynamic";
import { AuthModal } from "@/components/auth-modal";

export function ConnectButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (isSignedIn(dynamicClient)) {
      router.push("/dashboard");
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="border border-black bg-transparent px-10 py-3 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
      >
        Connect
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
