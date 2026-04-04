import { Module } from '@nestjs/common';
import { PriceFeedService } from './price-feed.service.js';
import { BlockListenerService } from './block-listener.service.js';

@Module({
  providers: [PriceFeedService, BlockListenerService],
  exports: [PriceFeedService],
})
export class PriceFeedModule {}
