# Aiwal (AI Wallet) — Product Spec

> ETHGlobal Cannes 2026 · Draft v0.1 · April 2026  
> Tags: `web3 wallet` `DeFi / trading` `AI agent` `Chainlink CRE` `Uniswap` `L2s`

---

## Vision

A next-generation web3 wallet that acts as an autonomous, AI-powered trading agent. Users deposit assets, set a trading profile, and interact via natural language — the wallet's context-aware LLM proposes on-chain transactions, which the user confirms. Off-chain signals from Chainlink CRE feed real-time market intelligence into the agent's reasoning loop, while all execution happens on-chain via Uniswap.

---

## Target Users

| Segment   | Description              |
| --------- | ------------------------ |
| Primary   | Retail crypto users      |
| Primary   | DeFi power traders       |
| Networks  | Base                     |
| MVP scope | Swaps (liq optimization) |

---

## User Flow

### 1. Create smart account

User onboards via Dynamic SDK. A smart contract account is deployed on Base — no seed phrase friction, social login supported.

### 2. Select trading profile

User picks one of two presets:

- **Institutional** — low risk, stable pools, yield priority
- **Degen** — higher risk tolerance, wider swap range, faster execution

This seeds the LLM context for all subsequent interactions.

### 3. Chat with the agent

User interacts via natural language. The LLM has full context: wallet balances, trading profile, live Chainlink price feeds, and recent on-chain history.

Example prompts:

- _"Rotate 30% of my ETH into stables if price drops 5%"_
- _"Find the best yield for my USDC right now"_

### 4. Review & confirm transaction

The LLM outputs a structured transaction proposal (swap params, expected output, slippage, gas estimate). User reviews and confirms — the smart account executes on-chain via Uniswap.

---

## Core Modules (MVP)

### AI trading agent

- Context-loaded LLM
- Natural language intent parsing
- Transaction proposal generation
- Profile-aware reasoning

### Smart account wallet

- Dynamic SDK onboarding
- ERC-4337 smart account
- Multi-L2 deployment
- Transaction signing UX

### Market data layer

- Chainlink CRE price feeds
- Real-time signal ingestion
- Custom logic triggers
- Feed-to-agent bridging

### Execution layer

- Uniswap API
- Optimal route finding
- Slippage & gas estimation
- (Liquidity pool selection)

---

## Tech Stack

| Component     | Role                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Dynamic SDK   | Smart account creation, social login, wallet management, multi-chain abstraction                              |
| Chainlink CRE | Off-chain compute runtime — real-time price feeds, custom signal logic, event triggers fed into agent context |
| Uniswap API   | On-chain swap execution, liquidity optimization, routing across Base / Arbitrum / Optimism pools              |
| LLM (TBD)     | Context-aware natural language interface, intent → transaction proposal, profile-seeded reasoning             |
| ERC-4337      | Account abstraction — smart contract wallets, gasless UX options, batched transactions                        |
| Base          | Low-cost execution chains — primary deployment targets for smart accounts and Uniswap pools                   |

---

## Hackathon Milestones

### Phase 0 - Architectural Setup

- Setup Architecture and complete JS / TS techstack
- Packages installation
- Code scaffolding

### Phase 1 — Wallet scaffolding

- Dynamic SDK integration
- Smart account deploy on Base
- Basic portfolio view

### Phase 2 — Agent core

- LLM context loading
- Trading profile presets
- Chat UI
- Transaction proposal output

### Phase 3 — Market signals

- Chainlink CRE price feeds wired into agent context
- Custom trigger logic

### Phase 4 — On-chain execution

- Uniswap routing
- Confirm & execute swap flow
- Slippage / gas display
- Demo end-to-end

---

## Open Questions

- **LLM provider** — Claude API.
- **Chainlink CRE → LLM bridge** — is the feed surfaced via structured prompt injection or tool call?
- **Trading profile parameters** — exact risk limits, pool constraints, and allowed token pairs per preset.
- **Transaction proposal format** — structured JSON rendered in UI vs. free-form LLM response with parsed calldata.
- **Security model** — how does the smart account limit agent-proposed transactions (max value, allowed tokens, slippage caps)?
