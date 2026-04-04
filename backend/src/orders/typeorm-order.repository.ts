import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderEntity } from '../persistence/order.entity';
import { Order, OrderStatus, OrderType } from './order';
import { CreateOrderData, OrderRepository } from './order.repository';

@Injectable()
export class TypeOrmOrderRepository extends OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
  ) {
    super();
  }

  private toDomain(entity: OrderEntity): Order {
    const order = new Order();
    order.id = entity.id;
    order.proposalId = entity.proposalId;
    order.type = entity.type as OrderType;
    order.amountIn = entity.amountIn;
    order.expectedOut = entity.expectedOut;
    order.to = entity.to;
    order.slippageTolerance = entity.slippageTolerance;
    order.tradingPriceUsd = entity.tradingPriceUsd;
    order.confirmationHash = entity.confirmationHash;
    order.status = entity.status as OrderStatus;
    order.createdAt = entity.createdAt;
    order.updatedAt = entity.updatedAt;
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProposalId(proposalId: string): Promise<Order[]> {
    const entities = await this.repo.findBy({ proposalId });
    return entities.map((e) => this.toDomain(e));
  }

  async create(proposalId: string, data: CreateOrderData): Promise<Order> {
    const entity = this.repo.create({ ...data, proposalId });
    return this.toDomain(await this.repo.save(entity));
  }

  async updateStatus(id: string, status: OrderStatus, confirmationHash?: string): Promise<Order> {
    await this.repo.update(id, { status, ...(confirmationHash && { confirmationHash }) });
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Order not found');
    return this.toDomain(entity);
  }

  async cancelActiveByProposalId(proposalId: string): Promise<void> {
    await this.repo.update(
      { proposalId, status: In([OrderStatus.Pending, OrderStatus.Submitted]) },
      { status: OrderStatus.Cancelled },
    );
  }
}
