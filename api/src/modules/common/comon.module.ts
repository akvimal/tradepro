import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { WebSocketService } from "./websocket.service";
import { RabbitMQService } from "./rabbitmq.service";
import { AppConfigService } from "./app-config.service";
import { AlertGateway } from "src/modules/common/alert.gateway";
import { ApiService } from "src/modules/common/api.service";
import { DhanService } from "src/modules/common/dhan.service";
import { MasterService } from "./master.service";

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [WebSocketService, RabbitMQService, AppConfigService, AlertGateway, ApiService, DhanService, MasterService],
  exports: [WebSocketService, RabbitMQService, AppConfigService, AlertGateway, ApiService, DhanService, MasterService]
})
export class CommonModule{}