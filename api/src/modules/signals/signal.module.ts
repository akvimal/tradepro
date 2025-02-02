import { Module } from '@nestjs/common';
import { CommonModule } from '../common/comon.module';
import { OrdersModule } from '../orders/orders.module';
import { StrategyModule } from '../strategy/strategy.module';
import { TrendService } from './trend.service';
import { TrendController } from './trend.controller';
import { SignalController } from './signal.controller';

@Module({
  imports: [CommonModule, OrdersModule, StrategyModule],
  controllers: [SignalController, TrendController],
  providers: [TrendService]
})
export class SignalModule {}
