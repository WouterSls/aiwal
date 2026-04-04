import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PriceFeedService } from '../price-feed/price-feed.service';
import { Order, OrderStatus, OrderType } from './order';
import { CreateOrderData, OrderRepository } from './order.repository';
import { Proposal, ProposalStatus } from './proposal';
import { ProposalsService } from './proposals.service';

interface OrderExecutePayload {
  orderId: string;
  proposalId: string;
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageTolerance?: string;
}

interface OrderConditionMetPayload {
  orderId: string;
  usdcPrice: number;
}

interface OrderExecutedPayload {
  orderId: string;
  confirmationHash?: string;
  success: boolean;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    private readonly repo: OrderRepository,
    private readonly proposalsService: ProposalsService,
    private readonly priceFeedService: PriceFeedService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.eventEmitter.on('order.condition.met', this.onConditionMet.bind(this));
    this.eventEmitter.on('order.executed', this.onExecuted.bind(this));
  }

  async findById(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findByProposalId(proposalId: string): Promise<Order[]> {
    return this.repo.findByProposalId(proposalId);
  }

  async createForProposal(proposal: Proposal, orders: CreateOrderData[]): Promise<Order[]> {
    const created: Order[] = [];
    for (const data of orders) {
      const order = await this.repo.create(proposal.id, data);
      if (order.type === OrderType.LimitOrder && order.tradingPriceUsd !== null) {
        this.priceFeedService.watchOrder(order.id, proposal.tokenIn, proposal.tokenOut, order.tradingPriceUsd);
      } else {
        this.emitExecute(order, proposal);
      }
      created.push(order);
    }
    return created;
  }

  async cancelProposal(proposalId: string): Promise<void> {
    const proposal = await this.proposalsService.findById(proposalId);
    if (proposal.status === ProposalStatus.Cancelled || proposal.status === ProposalStatus.Declined) {
      throw new BadRequestException(`Proposal is already ${proposal.status}`);
    }
    const activeOrders = await this.repo.findByProposalId(proposalId);
    await this.proposalsService.updateStatus(proposalId, ProposalStatus.Cancelled);
    await this.repo.cancelActiveByProposalId(proposalId);
    for (const order of activeOrders) {
      if (
        order.type === OrderType.LimitOrder &&
        (order.status === OrderStatus.Pending || order.status === OrderStatus.Submitted)
      ) {
        this.priceFeedService.unwatchOrder(order.id);
      }
    }
  }

  private async onConditionMet(payload: OrderConditionMetPayload): Promise<void> {
    const order = await this.repo.findById(payload.orderId);
    if (!order) throw new NotFoundException('Order not found');
    await this.repo.updateStatus(order.id, OrderStatus.Submitted);
    const proposal = await this.proposalsService.findById(order.proposalId);
    this.emitExecute(order, proposal);
  }

  private async onExecuted(payload: OrderExecutedPayload): Promise<void> {
    const status = payload.success ? OrderStatus.Completed : OrderStatus.Failed;
    await this.repo.updateStatus(payload.orderId, status, payload.confirmationHash);
  }

  private emitExecute(order: Order, proposal: Proposal): void {
    const executePayload: OrderExecutePayload = {
      orderId: order.id,
      proposalId: proposal.id,
      userId: proposal.userId,
      tokenIn: proposal.tokenIn,
      tokenOut: proposal.tokenOut,
      amountIn: order.amountIn,
      ...(order.slippageTolerance && { slippageTolerance: order.slippageTolerance }),
    };
    this.eventEmitter.emit('order.execute', executePayload);
  }
}
