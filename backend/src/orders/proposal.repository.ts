import { Proposal, ProposalStatus } from './proposal';

export interface CreateProposalData {
  userId: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
}

export abstract class ProposalRepository {
  abstract findById(id: string): Promise<Proposal | null>;
  abstract findByUserId(userId: string): Promise<Proposal[]>;
  abstract create(data: CreateProposalData): Promise<Proposal>;
  abstract updateStatus(id: string, status: ProposalStatus): Promise<Proposal>;
}