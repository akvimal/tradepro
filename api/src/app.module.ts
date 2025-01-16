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

@Module({
  imports: [ ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env`,
  }), TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
  }),TypeOrmModule.forFeature([]),],
  controllers: [SignalController,AlertController,FeedController],
  providers: [AlertGateway,AlertService,FeedService],
})
export class AppModule implements OnModuleInit {
  constructor() {}

  onModuleInit() {
    
  }
}
