export interface TransactionProposal {
  type: "swap" | "limit_order" | "stop_loss" | "take_profit";
  action: "buy" | "sell";
  token_in: string;
  token_out: string;
  amount_in: string;
  expected_out: string;
  slippage_tolerance: string;
  condition: string | null;
  reasoning: string;
}

export interface ParsedAgentResponse {
  text: string;
  proposal: TransactionProposal | null;
}

export function parseAgentResponse(content: string): ParsedAgentResponse {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    return { text: content, proposal: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const required = ["type", "action", "token_in", "token_out", "amount_in"];
    const valid = required.every((field) => parsed[field]);

    if (!valid) {
      return { text: content, proposal: null };
    }

    const text = content.replace(/```json[\s\S]*?```/, "").trim();
    return { text, proposal: parsed as TransactionProposal };
  } catch {
    return { text: content, proposal: null };
  }
}
