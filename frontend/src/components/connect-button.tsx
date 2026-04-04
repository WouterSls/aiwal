"use client";

import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";

export function ConnectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-black bg-transparent px-10 py-3 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
      >
        Connect
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
