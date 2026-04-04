import { Order, OrderStatus, OrderType } from './order';

export interface CreateOrderData {
  type: OrderType;
  amountIn: string;
  expectedOut?: string;
  to?: string;
  slippageTolerance?: string;
  tradingPriceUsd?: number;
}

export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findByProposalId(proposalId: string): Promise<Order[]>;
  abstract create(proposalId: string, data: CreateOrderData): Promise<Order>;
  abstract updateStatus(id: string, status: OrderStatus, confirmationHash?: string): Promise<Order>;
  abstract cancelActiveByProposalId(proposalId: string): Promise<void>;
}