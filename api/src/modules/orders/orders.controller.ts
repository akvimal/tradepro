import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RabbitMQService } from 'src/modules/common/rabbitmq.service';
import { AlertGateway } from 'src/modules/common/alert.gateway';
import { AccountService } from 'src/modules/accounts/account.service';
import { Constants } from '../common/constants';


@Controller('orders')
export class OrdersController {

  constructor(
    private readonly mqService: RabbitMQService, 
    private readonly gateway:AlertGateway,
    private readonly service:OrdersService, 
    // private readonly accountService:AccountService
  ) {}

  @Post('/summary')
  async findOrderByAlert(@Body() payload:any) {
    const {date} = payload;
   return await this.service.getOrderSummary(date); 
  }

  // @Post()
  // async create(@Body() payload:any) {
  //  return await this.service.placeOrder(payload); 
  // }

  @Post('/sqroff')
  async squareOff(@Body() orders:any) {
    // console.log('orders received to square:',orders);
    
   return await this.mqService.publishMessage(Constants.QUEUE_ORDER, {type:Constants.ORDER_CLOSE,orders}).catch(error => console.log(error));
  }


  // @Post('/sladjust')
  // async slAdjust(@Body() payload:any) {
  //   const {security,price} = payload;
  //   //change SL leg trigger
  //   //publish latest orders
  //  return await this.service.adjustSL(security,price); 
  // }

}