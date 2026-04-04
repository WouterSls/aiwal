export enum ProposalStatus {
  Accepted = 'accepted',
  Declined = 'declined',
  Cancelled = 'cancelled',
}

export class Proposal {
  id: string;
  userId: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}