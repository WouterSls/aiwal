"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TransactionProposal } from "@/lib/claude";

interface ConfirmationModalProps {
  proposal: TransactionProposal;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  proposal,
  open,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="border border-black rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xs font-medium uppercase tracking-widest">
            Confirm Trade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="border border-black/20 p-4 text-center">
            <div className="text-2xl font-black uppercase tracking-tight">
              {proposal.amount_in} {proposal.token_in}
            </div>
            <div className="my-1 text-black/40">→</div>
            <div className="text-2xl font-black uppercase tracking-tight">
              {proposal.expected_out} {proposal.token_out}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <Row label="Type" value={proposal.type.replace("_", " ")} />
            <Row label="Slippage" value={`${proposal.slippage_tolerance}%`} />
            {proposal.condition && (
              <Row label="Condition" value={proposal.condition} />
            )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-black/50 uppercase tracking-widest text-xs">
        {label}
      </span>
      <span className="font-medium uppercase tracking-widest text-xs">
        {value}
      </span>
    </div>
  );
}
