import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { AlertService } from './alert.service';
import { OrderService } from './order.service';
import * as moment from 'moment-timezone';
import { DhanService } from './dhan.service';
import { AlertGateway } from './alert.gateway';

@Controller('orders')
export class OrderController {

  constructor(private gateway:AlertGateway, private service:OrderService, private dhanService:DhanService) {}

  @Post('/summary')
  async findOrderByAlert(@Body() payload:any) {
    const {alertid,date} = payload;
   return await this.service.findOrderSummary(alertid,date); 
  }

  @Post()
  async create(@Body() payload:any) {
   return await this.service.createOrder(payload); 
  }

  @Post('/sqroff/:alertid')
  async squareOff(@Param('alertid') alertid:number, @Body() payload:any) {
    
    const price = await this.dhanService.getLtp(payload);
    const secs = Object.values(price);
    for (const [key, value] of Object.entries(secs[0])) {
      await this.service.squareOff(key,value['last_price']); 
    }
    const orders = await this.service.findOrderSummary({alertid});
            await this.gateway.publishData({type:'ORDER',orders});
    //get LTP of security and update the SL with traded status
    //publish latest orders
   return {}//await this.service.squareOff(security,price); 
  }

  @Post('/sladjust')
  async slAdjust(@Body() payload:any) {
    const {security,price} = payload;
    //change SL leg trigger
    //publish latest orders
   return await this.service.adjustSL(security,price); 
  }

}