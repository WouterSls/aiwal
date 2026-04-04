"use client";

import { useState } from "react";
import {
  sendEmailOTP,
  authenticateWithSocial,
  type SocialProvider,
  type OTPVerification,
} from "@dynamic-labs-sdk/client";
import { OtpInput } from "@/components/otp-input";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [otpVerification, setOtpVerification] = useState<OTPVerification | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  if (!open) return null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const verification = await sendEmailOTP({ email });
      setOtpVerification(verification);
    } catch {
      toast.error("Failed to send code. Try again.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSocial(provider: SocialProvider) {
    setSocialLoading(provider);
    try {
      await authenticateWithSocial(
        { provider, redirectUrl: window.location.origin },
      );
    } catch {
      toast.error("Social login failed. Try again.");
      setSocialLoading(null);
    }
  }

  function handleBack() {
    setOtpVerification(null);
    setEmail("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative flex w-full max-w-sm flex-col gap-8 bg-white p-10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-sm lowercase tracking-widest text-black"
        >
          close
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tight">
          Connect
        </h2>

        {otpVerification ? (
          <OtpInput otpVerification={otpVerification} onBack={handleBack} />
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="border border-black px-4 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={emailLoading}
              className="border border-black bg-black px-10 py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailLoading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {/**
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-black/40">or continue with</p>
          {(["google", "discord"] as SocialProvider[]).map((provider) => (
            <button
              key={provider}
              onClick={() => handleSocial(provider)}
              disabled={socialLoading !== null}
              className="border border-black px-10 py-3 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {socialLoading === provider ? "Redirecting..." : provider}
            </button>
          ))}
        </div>
        */}
      </div>
    </div>
  );
}
