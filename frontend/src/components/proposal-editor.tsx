"use client";

import { Trade, TradingStrategy } from "@/lib/claude";

interface ProposalEditorProps {
  strategy: TradingStrategy;
  onChange: (strategy: TradingStrategy) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProposalEditor({
  strategy,
  onChange,
  onConfirm,
  onCancel,
}: ProposalEditorProps) {
  const isMulti = strategy.trades.length > 1;

  function updateTrade(index: number, patch: Partial<Trade>) {
    const trades = strategy.trades.map((t, i) =>
      i === index ? { ...t, ...patch } : t,
    );
    onChange({ ...strategy, trades });
  }

  function removeTrade(index: number) {
    onChange({
      ...strategy,
      trades: strategy.trades.filter((_, i) => i !== index),
    });
  }

  function addTrade() {
    const last = strategy.trades[strategy.trades.length - 1];
    onChange({ ...strategy, trades: [...strategy.trades, { ...last }] });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-widest text-black/50">
          Proposal
        </p>
        <h2 className="mt-1 text-sm font-bold uppercase tracking-widest">
          {strategy.title}
        </h2>
        <p className="mt-1 text-xs text-black/60 leading-relaxed">
          {strategy.reasoning}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {strategy.trades.map((trade, i) => (
          <TradeRow
            key={i}
            trade={trade}
            index={i}
            tokenIn={strategy.token_in}
            tokenOut={strategy.token_out}
            defaultOpen={!isMulti}
            showRemove={strategy.trades.length > 1}
            onChange={(patch) => updateTrade(i, patch)}
            onTokenInChange={(val) => onChange({ ...strategy, token_in: val })}
            onRemove={() => removeTrade(i)}
          />
        ))}

        <button
          onClick={addTrade}
          className="w-full border border-black/30 py-2 text-xs uppercase tracking-widest text-black/50 hover:border-black hover:text-black transition-colors"
        >
          + Add trade
        </button>
      </div>

      <div className="flex gap-2 border-t border-black p-4">
        <button
          onClick={onConfirm}
          className="flex-1 border border-black bg-black py-2 text-sm font-medium uppercase tracking-widest text-white"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-black bg-white py-2 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-black/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface TradeRowProps {
  trade: Trade;
  index: number;
  tokenIn: string;
  tokenOut: string;
  defaultOpen: boolean;
  showRemove: boolean;
  onChange: (patch: Partial<Trade>) => void;
  onTokenInChange: (val: string) => void;
  onRemove: () => void;
}

function tradeHeader(trade: Trade, tokenIn: string, tokenOut: string): string {
  const amount = trade.amount_in || "—";
  if (trade.type === "send") {
    return `send: ${amount} ${tokenIn} to: ${trade.to || "—"}`;
  }
  if (trade.type === "limit_order") {
    return `limit order: ${tokenIn} → ${tokenOut} @ $${trade.tradingPriceUsd ?? "—"}`;
  }
  return `swap: ${tokenIn} → ${tokenOut} @ market`;
}

function TradeRow({
  trade,
  index,
  tokenIn,
  tokenOut,
  defaultOpen,
  showRemove,
  onChange,
  onTokenInChange,
  onRemove,
}: TradeRowProps) {
  const isSend = trade.type === "send";
  const isSwap = trade.type === "swap";
  const isLimit = trade.type === "limit_order";

  return (
    <details open={defaultOpen} className="border border-black group">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-medium uppercase tracking-widest list-none">
        <span>
          <span className="text-black/40 mr-2">#{index + 1}</span>
          {tradeHeader(trade, tokenIn, tokenOut)}
        </span>
        <span className="text-black/30 group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="border-t border-black/20 px-4 py-4 space-y-3">
        <Field label="Type">
          <select
            value={trade.type}
            onChange={(e) =>
              onChange({
                type: e.target.value as Trade["type"],
                amount_in: "",
                expected_out: null,
                slippage_tolerance: null,
                tradingPriceUsd: null,
                to: null,
              })
            }
            className="w-full border border-black bg-white px-3 py-2 text-sm uppercase tracking-widest focus:outline-none"
          >
            <option value="swap">Swap</option>
            <option value="limit_order">Limit Order</option>
            <option value="send">Send</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Token In">
            <input
              value={tokenIn}
              onChange={(e) => onTokenInChange(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
          <Field label="Amount In">
            <input
              value={trade.amount_in}
              onChange={(e) => onChange({ amount_in: e.target.value })}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        </div>

        {isSend && (
          <Field label="To">
            <input
              value={trade.to ?? ""}
              onChange={(e) => onChange({ to: e.target.value })}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        )}

        {isSwap && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expected Out">
              <input
                value={trade.expected_out ?? ""}
                readOnly
                className="w-full border border-black px-3 py-2 text-sm focus:outline-none bg-black/5 text-black/50 cursor-default"
              />
            </Field>
            <Field label="Slippage (%)">
              <input
                value={trade.slippage_tolerance ?? ""}
                onChange={(e) =>
                  onChange({ slippage_tolerance: e.target.value })
                }
                className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
              />
            </Field>
          </div>
        )}

        {isSwap && (
          <Field label="Price (USD)">
            <input
              value={trade.tradingPriceUsd ?? ""}
              onChange={(e) =>
                onChange({
                  tradingPriceUsd: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        )}

        {isLimit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slippage (%)">
              <input
                value={trade.slippage_tolerance ?? ""}
                onChange={(e) =>
                  onChange({ slippage_tolerance: e.target.value })
                }
                className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
              />
            </Field>
            <Field label="Price (USD)">
              <input
                value={trade.tradingPriceUsd ?? ""}
                onChange={(e) =>
                  onChange({
                    tradingPriceUsd: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="w-full border border-black px-3 py-2 text-sm focus:outline-none"
              />
            </Field>
          </div>
        )}

        {showRemove && (
          <button
            onClick={onRemove}
            className="text-xs uppercase tracking-widest text-black/40 hover:text-red-600 transition-colors"
          >
            Remove trade
          </button>
        )}
      </div>
    </details>
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
