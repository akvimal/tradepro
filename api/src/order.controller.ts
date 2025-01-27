import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { AlertService } from './alert.service';
import { OrderService } from './order.service';
import * as moment from 'moment-timezone';

@Controller('orders')
export class OrderController {

  constructor(private service:OrderService) {}

  @Post('/summary')
  async findOrderByAlert(@Body() payload:any) {
   return await this.service.findOrderSummary(payload); 
  }

  @Post()
  async create(@Body() payload:any) {
   return await this.service.createOrder(payload); 
  }

}