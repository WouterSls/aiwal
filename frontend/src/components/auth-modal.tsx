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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [otpVerification, setOtpVerification] = useState<OTPVerification | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="flex w-full max-w-sm flex-col gap-8 rounded-none bg-white p-10 shadow-none ring-0">
        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
          Connect
        </DialogTitle>

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
              disabled={emailLoading || !emailValid}
              className="border border-black bg-black px-10 py-3 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailLoading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
