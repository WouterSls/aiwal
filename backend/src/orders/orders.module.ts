import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../persistence/order.entity.js';
import { ProposalEntity } from '../persistence/proposal.entity.js';
import { PriceFeedModule } from '../price-feed/price-feed.module.js';
import { OrderRepository } from './order.repository.js';
import { OrdersService } from './orders.service.js';
import { ProposalRepository } from './proposal.repository.js';
import { ProposalsController } from './proposals.controller.js';
import { ProposalsService } from './proposals.service.js';
import { TypeOrmOrderRepository } from './typeorm-order.repository.js';
import { TypeOrmProposalRepository } from './typeorm-proposal.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalEntity, OrderEntity]), PriceFeedModule],
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    OrdersService,
    { provide: ProposalRepository, useClass: TypeOrmProposalRepository },
    { provide: OrderRepository, useClass: TypeOrmOrderRepository },
  ],
  exports: [ProposalsService, OrdersService],
})
export class OrdersModule {}
