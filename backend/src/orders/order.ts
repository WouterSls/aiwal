export enum OrderType {
  Send = 'send',
  Swap = 'swap',
  LimitOrder = 'limit_order',
}

export enum OrderStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class Order {
  id: string;
  proposalId: string;
  type: OrderType;
  amountIn: string;
  expectedOut: string | null;
  to: string | null;
  slippageTolerance: string | null;
  tradingPriceUsd: number | null;
  confirmationHash: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}