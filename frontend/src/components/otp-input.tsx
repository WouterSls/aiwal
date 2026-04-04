"use client";

import { useState } from "react";
import { verifyOTP, type OTPVerification } from "@dynamic-labs-sdk/client";
import { toast } from "sonner";

interface OtpInputProps {
  otpVerification: OTPVerification;
  onBack: () => void;
}

export function OtpInput({ otpVerification, onBack }: OtpInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP({ otpVerification, verificationToken: code });
    } catch {
      toast.error("Invalid code. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="border border-black px-4 py-2 text-center text-lg tracking-widest outline-none"
      />
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="border border-black bg-black px-10 py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm lowercase tracking-widest text-black underline"
      >
        back
      </button>
    </form>
  );
}
