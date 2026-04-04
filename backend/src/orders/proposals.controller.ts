import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserEntity } from '../users/user.entity.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { CreateProposalDto } from './dto/create-proposal.dto.js';
import { ProposalResponseDto } from './dto/proposal-response.dto.js';
import { OrdersService } from './orders.service.js';
import { ProposalsService } from './proposals.service.js';

@Controller('api/proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateProposalDto,
  ): Promise<ProposalResponseDto> {
    if (!user.isDelegated()) {
      throw new HttpException({ code: 'DELEGATION_REQUIRED' }, HttpStatus.CONFLICT);
    }
    const proposal = await this.proposalsService.create({
      userId: user.id,
      title: dto.title,
      reasoning: dto.reasoning,
      tokenIn: dto.tokenIn,
      tokenOut: dto.tokenOut,
    });
    await this.ordersService.createForProposal(proposal, dto.orders);
    return ProposalResponseDto.from(proposal);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<ProposalResponseDto[]> {
    const proposals = await this.proposalsService.findByUserId(userId);
    return proposals.map((p) => ProposalResponseDto.from(p));
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ProposalResponseDto> {
    const proposal = await this.proposalsService.findById(id);
    if (proposal.userId !== userId) throw new NotFoundException('Proposal not found');
    return ProposalResponseDto.from(proposal);
  }

  @Get(':id/orders')
  async findOrders(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<OrderResponseDto[]> {
    const proposal = await this.proposalsService.findById(id);
    if (proposal.userId !== userId) throw new NotFoundException('Proposal not found');
    const orders = await this.ordersService.findByProposalId(id);
    return orders.map((o) => OrderResponseDto.from(o));
  }

  @Delete(':id')
  @HttpCode(204)
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const proposal = await this.proposalsService.findById(id);
    if (proposal.userId !== userId) throw new NotFoundException('Proposal not found');
    await this.ordersService.cancelProposal(id);
  }
}
