import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalEntity } from '../persistence/proposal.entity';
import { Proposal, ProposalStatus } from './proposal';
import { CreateProposalData, ProposalRepository } from './proposal.repository';

@Injectable()
export class TypeOrmProposalRepository extends ProposalRepository {
  constructor(
    @InjectRepository(ProposalEntity)
    private readonly repo: Repository<ProposalEntity>,
  ) {
    super();
  }

  private toDomain(entity: ProposalEntity): Proposal {
    const proposal = new Proposal();
    proposal.id = entity.id;
    proposal.userId = entity.userId;
    proposal.title = entity.title;
    proposal.reasoning = entity.reasoning;
    proposal.tokenIn = entity.tokenIn;
    proposal.tokenOut = entity.tokenOut;
    proposal.status = entity.status as ProposalStatus;
    proposal.createdAt = entity.createdAt;
    proposal.updatedAt = entity.updatedAt;
    return proposal;
  }

  async findById(id: string): Promise<Proposal | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Proposal[]> {
    const entities = await this.repo.findBy({ userId });
    return entities.map((e) => this.toDomain(e));
  }

  async create(data: CreateProposalData): Promise<Proposal> {
    const entity = this.repo.create({ ...data, status: ProposalStatus.Accepted });
    return this.toDomain(await this.repo.save(entity));
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    await this.repo.update(id, { status });
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Proposal not found');
    return this.toDomain(entity);
  }
}
