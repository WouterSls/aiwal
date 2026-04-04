import { Order, OrderStatus, OrderType } from '../order';

export class OrderResponseDto {
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

  static from(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.proposalId = order.proposalId;
    dto.type = order.type;
    dto.amountIn = order.amountIn;
    dto.expectedOut = order.expectedOut;
    dto.to = order.to;
    dto.slippageTolerance = order.slippageTolerance;
    dto.tradingPriceUsd = order.tradingPriceUsd;
    dto.confirmationHash = order.confirmationHash;
    dto.status = order.status;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    return dto;
  }
}
