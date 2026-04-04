import { Proposal, ProposalStatus } from '../proposal';

export class ProposalResponseDto {
  id: string;
  title: string;
  reasoning: string;
  tokenIn: string;
  tokenOut: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;

  static from(proposal: Proposal): ProposalResponseDto {
    const dto = new ProposalResponseDto();
    dto.id = proposal.id;
    dto.title = proposal.title;
    dto.reasoning = proposal.reasoning;
    dto.tokenIn = proposal.tokenIn;
    dto.tokenOut = proposal.tokenOut;
    dto.status = proposal.status;
    dto.createdAt = proposal.createdAt;
    dto.updatedAt = proposal.updatedAt;
    return dto;
  }
}
