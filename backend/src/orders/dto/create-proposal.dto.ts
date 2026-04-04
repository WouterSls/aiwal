import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OrderType } from '../order.js';

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @IsString()
  @IsNotEmpty()
  amountIn: string;

  @IsOptional()
  @IsString()
  expectedOut?: string;

  @ValidateIf((o) => o.type === OrderType.Send)
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  slippageTolerance?: string;

  @ValidateIf((o) => o.type === OrderType.LimitOrder)
  @IsNumber()
  tradingPriceUsd?: number;
}

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  reasoning: string;

  @IsString()
  @IsNotEmpty()
  tokenIn: string;

  @IsString()
  @IsNotEmpty()
  tokenOut: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDto)
  orders: CreateOrderDto[];
}
