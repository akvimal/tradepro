import { Module, OnModuleInit } from '@nestjs/common';
import { SignalController } from './signal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';
import { ConfigModule } from '@nestjs/config';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AlertGateway } from './alert.gateway';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { RabbitMQService } from './common/rabbitmq.service';
import { AlertProcessor } from './alert.processor';
import { AlertConsumer } from './alert.consumer';
import { TrendService } from './trend.service';
import { TrendController } from './trend.controller';
import { AccountService } from './account.service';
import { MasterService } from './master.service';
import { ApiService } from './api.service';
import { HttpModule } from '@nestjs/axios';
import { DhanService } from './dhan.service';
import { WebSocketService } from './common/websocket.service';
import { AppConfigService } from './common/app-config.service';

import { OrdersController } from './modules/orders/orders.controller';
import { OrderConsumer } from './modules/orders/order.consumer';
import { OrderProcessor } from './modules/orders/order.processor';
import { OrdersRepo } from './modules/orders/orders.repo';
import { OrdersService } from './modules/orders/orders.service';
import { ScheduleModule } from '@nestjs/schedule';
import { WatchmanService } from './watchman.service';
import { PriceConsumer } from './modules/prices/price.consumer';
import { PriceProcessor } from './modules/prices/price.processor';
import { PriceService } from './modules/prices/price.service';

@Module({
  imports: [ ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env`,
  }), TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
  }),TypeOrmModule.forFeature([]),
HttpModule,
ScheduleModule.forRoot()],
  controllers: [SignalController,TrendController,AlertController,FeedController,OrdersController],
  providers: [WatchmanService, WebSocketService,RabbitMQService, AppConfigService, AlertGateway, ApiService, DhanService, 
    OrdersService, OrdersRepo, OrderProcessor, OrderConsumer,
    MasterService, 
    AlertConsumer, AlertProcessor, AlertService,
    TrendService,  FeedService,  AccountService, PriceConsumer,PriceProcessor,PriceService],
})
export class AppModule {}
