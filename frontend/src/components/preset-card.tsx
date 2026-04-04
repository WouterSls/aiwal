"use client";

import { cn } from "@/lib/utils";

type Preset = "institutional" | "degen";

const PRESETS: Record<
  Preset,
  { name: string; risk: string; description: string; traits: string[] }
> = {
  institutional: {
    name: "Institutional",
    risk: "Low",
    description:
      "Conservative strategy focused on blue chip assets. Limited to established tokens with deep liquidity.",
    traits: [
      "Risk averse investing and trading",
      "Blue chip tokens only",
      "Max 5% position size per trade",
      "0.5% slippage tolerance",
      "Gradual entry & exit",
    ],
  },
  degen: {
    name: "Degen",
    risk: "High",
    description:
      "Aggressive strategy with high risk tolerance. Any token available on Uniswap Base is fair game.",
    traits: [
      "Full ape, make me rich",
      "Any Uniswap Base token",
      "Up to 100% position size per trade",
      "5% slippage tolerance",
      "Aggressive entry & exit",
    ],
  },
};

interface PresetCardProps {
  preset: Preset;
  selected: boolean;
  onSelect: () => void;
}

export function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  const { name, risk, description, traits } = PRESETS[preset];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-6 border p-8 text-left transition-all hover:scale-105",
        selected ? "border-black ring-2 ring-black" : "border-black/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl font-black uppercase tracking-widest">
          {name}
        </span>
        <span
          className={cn(
            "shrink-0 border px-2 py-0.5 text-xs font-medium uppercase tracking-widest",
            risk === "High"
              ? "border-black bg-black text-white"
              : "border-black/30 text-black/50",
          )}
        >
          {risk} risk
        </span>
      </div>

      <p className="text-sm leading-relaxed text-black/70">{description}</p>

      <ul className="flex flex-col gap-2">
        {traits.map((trait) => (
          <li
            key={trait}
            className="flex items-center gap-2 text-xs text-black/60"
          >
            <span className="h-px w-3 shrink-0 bg-black/30" />
            {trait}
          </li>
        ))}
      </ul>
    </button>
  );
}
