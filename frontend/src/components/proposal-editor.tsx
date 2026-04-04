"use client";

import { TransactionProposal } from "@/lib/claude";

interface ProposalEditorProps {
  proposal: TransactionProposal;
  onChange: (proposal: TransactionProposal) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProposalEditor({
  proposal,
  onChange,
  onConfirm,
  onCancel,
}: ProposalEditorProps) {
  function update<K extends keyof TransactionProposal>(
    key: K,
    value: TransactionProposal[K],
  ) {
    onChange({ ...proposal, [key]: value });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black px-6 py-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-black/50">
          Proposal
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <Field label="Type">
          <select
            value={proposal.type}
            onChange={(e) =>
              update("type", e.target.value as TransactionProposal["type"])
            }
            className="w-full border border-black bg-white px-3 py-2 text-sm uppercase tracking-widest focus:outline-none"
          >
            <option value="swap">Swap</option>
            <option value="limit_order">Limit Order</option>
            <option value="stop_loss">Stop Loss</option>
            <option value="take_profit">Take Profit</option>
          </select>
        </Field>

        <Field label="Action">
          <input
            value={proposal.action}
            onChange={(e) => update("action", e.target.value as TransactionProposal["action"])}
            className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Token In">
            <input
              value={proposal.token_in}
              onChange={(e) => update("token_in", e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
          <Field label="Token Out">
            <input
              value={proposal.token_out}
              onChange={(e) => update("token_out", e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount In">
            <input
              type="number"
              value={proposal.amount_in}
              onChange={(e) => update("amount_in", e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
          <Field label="Expected Out">
            <input
              type="number"
              value={proposal.expected_out}
              onChange={(e) => update("expected_out", e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Slippage (%)">
          <input
            type="number"
            value={proposal.slippage_tolerance}
            onChange={(e) => update("slippage_tolerance", e.target.value)}
            className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
          />
        </Field>

        <Field label="Condition">
          <input
            value={proposal.condition ?? ""}
            onChange={(e) => update("condition", e.target.value || null)}
            className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            placeholder="e.g. price > 3000"
          />
        </Field>

        {proposal.reasoning && (
          <div className="border border-black/20 p-3 text-xs text-black/60 leading-relaxed">
            {proposal.reasoning}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-black p-4">
        <button
          onClick={onConfirm}
          className="flex-1 border border-black bg-black py-2 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-black bg-white py-2 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-black/50">
        {label}
      </label>
      {children}
    </div>
  );
}
