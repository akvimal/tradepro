import { Module } from '@nestjs/common';
import { CommonModule } from '../common/comon.module';
import { PriceConsumer } from './price.consumer';
import { PriceProcessor } from './price.processor';
import { PriceService } from './price.service';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [CommonModule],
  controllers: [FeedController],
  providers: [PriceProcessor, PriceService, FeedService],
  exports: [PriceService]
})
export class PriceModule {}
