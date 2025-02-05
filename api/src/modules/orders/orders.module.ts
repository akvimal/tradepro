import { Module } from "@nestjs/common";
import { CommonModule } from "../common/comon.module";
import { OrdersController } from "./orders.controller";
import { OrderConsumer } from "./order.consumer";
import { OrderProcessor } from "./order.processor";
import { OrdersRepo } from "./orders.repo";
import { OrdersService } from "./orders.service";
import { PriceModule } from "../price/price.module";
import { AccountsModule } from "../accounts/accounts.module";

@Module({
  imports: [CommonModule, AccountsModule, PriceModule],
  controllers: [OrdersController],
  providers: [OrderConsumer, OrderProcessor, OrdersService, OrdersRepo],
  exports: [OrdersService,OrderProcessor]
})
export class OrdersModule{}