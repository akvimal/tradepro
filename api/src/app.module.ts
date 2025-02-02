import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';
import { ConfigModule } from '@nestjs/config';
import { MasterService } from './modules/common/master.service';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './modules/common/comon.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { SignalModule } from './modules/signals/signal.module';
import { PriceModule } from './modules/price/price.module';
import { BackgroundService } from './background.service';

@Module({
  imports: [ 
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }), 
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([]),
    ScheduleModule.forRoot(),
    HttpModule,
    CommonModule, SignalModule, StrategyModule, OrdersModule, PriceModule
  ],
  providers: [BackgroundService],
})
export class AppModule {}
