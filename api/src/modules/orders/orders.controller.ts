import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RabbitMQService } from 'src/common/rabbitmq.service';
import { AlertGateway } from 'src/alert.gateway';
import { AccountService } from 'src/account.service';


@Controller('orders')
export class OrdersController {

  constructor(private readonly mqService: RabbitMQService, private gateway:AlertGateway,
    private service:OrdersService, private accountService:AccountService) {}

  @Post('/summary')
  async findOrderByAlert(@Body() payload:any) {
    const {strategy,date} = payload;
   return await this.service.getOrderSummary(strategy,date); 
  }

  @Post()
  async create(@Body() payload:any) {
   return await this.service.placeOrder(payload); 
  }

  @Post('/sqroff')
  async squareOff(@Body() orders:any) {
    console.log('orders received to square:',orders);
    
   return await this.mqService.publishMessage('orderQueue', {type:'CLOSE',orders}).catch(error => console.log(error));
  }


  @Post('/sladjust')
  async slAdjust(@Body() payload:any) {
    const {security,price} = payload;
    //change SL leg trigger
    //publish latest orders
   return await this.service.adjustSL(security,price); 
  }

}