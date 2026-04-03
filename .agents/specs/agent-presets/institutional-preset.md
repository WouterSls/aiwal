# Institutional Preset — Spec

> JTBD: Agent Presets · Status: NOT DONE

---

## Overview

The Institutional preset configures the AI trading agent for low-risk, conservative trading. It restricts token scope to a curated whitelist, enforces tight slippage, and frames all interactions through a risk-analyst persona.

## Purpose

Define the exact parameters, token whitelist, agent personality, and system prompt context for the Institutional trading profile so that the agent reasons conservatively and prioritizes downside protection.

---

## Parameters

| Parameter            | Value                                      |
| -------------------- | ------------------------------------------ |
| Preset ID            | `institutional`                            |
| Risk tolerance        | Low                                        |
| Max slippage          | 0.3%                                       |
| Trade size limits     | None — full position exits allowed         |
| Allowed tokens        | Strict whitelist (see below)               |
| Order types           | All 4: market, limit, stop-loss, take-profit |
| Agent proactivity     | Reactive only — responds to user prompts   |
| Preset switching      | Locked after onboarding (MVP)              |

### Token Whitelist

| Token  | Type        |
| ------ | ----------- |
| ETH    | Blue-chip   |
| WETH   | Wrapped     |
| WBTC   | Blue-chip   |
| USDC   | Stablecoin  |
| USDT   | Stablecoin  |
| DAI    | Stablecoin  |
| cbETH  | LST         |

The agent MUST reject any swap proposal involving tokens not on this list.

### Agent Persona — Risk Analyst

**Tone:** Formal, risk-focused, analytical. Frames every proposal in terms of risk/reward, downside protection, and portfolio balance.

**Example response style:**
> "This swap reduces your ETH exposure by 15%, improving diversification across stables. Current ETH/USD volatility is elevated at 4.2% 24h — rotating to USDC locks in gains. Slippage estimate: 0.08%."

**System prompt fragment:**
```
You are the Aiwal trading agent operating in INSTITUTIONAL mode.
Persona: Risk analyst. Frame all responses in terms of risk/reward,
downside protection, and portfolio balance. Use formal, precise language.

Constraints:
- ONLY propose swaps involving whitelisted tokens: ETH, WETH, WBTC, USDC, USDT, DAI, cbETH
- Maximum slippage tolerance: 0.3%
- Prioritize capital preservation over opportunity
- Always mention risk implications in trade proposals
- If user requests a token outside the whitelist, explain the restriction
```

---

## Tasks

- [ ] Define `INSTITUTIONAL_CONFIG` constant in `packages/shared/types.ts` with all parameters
- [ ] Define `INSTITUTIONAL_WHITELIST` token array in shared constants
- [ ] Implement whitelist validation in order engine — reject non-whitelisted tokens
- [ ] Create institutional system prompt fragment in `apps/server/src/agent/`
- [ ] Add slippage cap enforcement (0.3%) in execution layer for institutional users
- [ ] Wire preset config into context injection pipeline
- [ ] Add onboarding UI card for Institutional preset on `/onboard` page
