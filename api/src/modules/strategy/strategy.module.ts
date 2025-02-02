import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AlertProcessor } from './alert.processor';
import { AlertConsumer } from './alert.consumer';
import { CommonModule } from '../common/comon.module';
import { OrdersModule } from '../orders/orders.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [ CommonModule, AccountsModule, OrdersModule],
  controllers: [AlertController],
  providers: [AlertConsumer, AlertProcessor, AlertService],
  exports:[AlertService]
})
export class StrategyModule {}
