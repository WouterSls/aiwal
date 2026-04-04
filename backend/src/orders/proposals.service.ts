import { Injectable, NotFoundException } from '@nestjs/common';
import { Proposal, ProposalStatus } from './proposal.js';
import { CreateProposalData, ProposalRepository } from './proposal.repository.js';

@Injectable()
export class ProposalsService {
  constructor(private readonly repo: ProposalRepository) {}

  async findById(id: string): Promise<Proposal> {
    const proposal = await this.repo.findById(id);
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  findByUserId(userId: string): Promise<Proposal[]> {
    return this.repo.findByUserId(userId);
  }

  create(data: CreateProposalData): Promise<Proposal> {
    return this.repo.create(data);
  }

  updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    return this.repo.updateStatus(id, status);
  }
}
