import { Module, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import { SignalController } from './signal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';
import { ConfigModule } from '@nestjs/config';
import { AlertService } from './alert.service';

@Module({
  imports: [ ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env`,
  }), TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
  }),TypeOrmModule.forFeature([]),],
  controllers: [SignalController],
  providers: [AppService,AppGateway,AlertService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly service: AppService) {}

  onModuleInit() {
    this.service.startPublishing();
  }
}
