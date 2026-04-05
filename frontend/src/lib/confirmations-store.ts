export interface ConfirmationPayload {
  id: string;
  proposalId: string;
  type: 'send' | 'swap' | 'limit_order';
  amountIn: string;
  expectedOut?: string;
  slippageTolerance?: string;
  confirmationHash?: string;
  status: 'completed' | 'failed';
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

const queue: ConfirmationPayload[] = [];

export function enqueue(payload: ConfirmationPayload): void {
  queue.push(payload);
}

export function consume(walletAddress: string): ConfirmationPayload[] {
  const matches = queue.filter(c => c.walletAddress === walletAddress);
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].walletAddress === walletAddress) {
      queue.splice(i, 1);
    }
  }
  return matches;
}
