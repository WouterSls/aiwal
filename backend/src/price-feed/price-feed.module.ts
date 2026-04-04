import { Module } from '@nestjs/common';
import { PriceFeedService } from './price-feed.service.js';

@Module({
  providers: [PriceFeedService],
  exports: [PriceFeedService],
})
export class PriceFeedModule {}
