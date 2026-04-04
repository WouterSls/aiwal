import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../persistence/order.entity';
import { ProposalEntity } from '../persistence/proposal.entity';
import { PriceFeedModule } from '../price-feed/price-feed.module';
import { OrderRepository } from './order.repository';
import { OrdersService } from './orders.service';
import { ProposalRepository } from './proposal.repository';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { TypeOrmOrderRepository } from './typeorm-order.repository';
import { TypeOrmProposalRepository } from './typeorm-proposal.repository';

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
