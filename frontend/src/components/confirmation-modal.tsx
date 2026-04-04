"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TradingStrategy } from "@/lib/claude";

interface ConfirmationModalProps {
  strategy: TradingStrategy;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  strategy,
  open,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="border border-black rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xs font-medium uppercase tracking-widest">
            Confirm Strategy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="border border-black/20 p-4">
            <div className="text-lg font-black uppercase tracking-tight">
              {strategy.title}
            </div>
            <div className="mt-1 text-xs text-black/50 leading-relaxed">
              {strategy.reasoning}
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-black/50">
            {strategy.trades.length} trade{strategy.trades.length !== 1 ? "s" : ""}
          </div>

          <div className="space-y-1">
            {strategy.trades.map((t, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-black/40">#{i + 1}</span>
                <span className="uppercase tracking-widest">
                  {t.amount_in} {strategy.token_in} → {strategy.token_out}
                </span>
                {t.tradingPriceUsd && (
                  <span className="text-black/50">@ ${t.tradingPriceUsd}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 border border-black bg-white py-2 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 border border-black bg-black py-2 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
          >
            Confirm
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
