import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { OrderService } from './order.service';
import { DhanService } from './dhan.service';
import { AlertGateway } from './alert.gateway';
import { AccountService } from './account.service';
import { log } from 'console';
import { RabbitMQService } from './common/rabbitmq.service';

@Controller('orders')
export class OrderController {

  constructor(private readonly mqService: RabbitMQService, private gateway:AlertGateway,
    private service:OrderService, private accountService:AccountService) {}

  @Post('/summary')
  async findOrderByAlert(@Body() payload:any) {
    const {alertid,date} = payload;
   return await this.service.findOrderSummary(alertid,date); 
  }

  @Post()
  async create(@Body() payload:any) {
   return await this.service.createOrder(payload); 
  }

  @Post('/sqroff')
  async squareOff(@Body() orders:any) {
    //receives array of orders to square off
    // log('ORDERS: ',orders)
 
    
    // orders.forEach(order => {
    //   const {strategy,exchange,segment,security} = order;  
    //   console.log(order);
      
    // });
    console.log(orders);
    
    
    await this.mqService.publishMessage('orderQueue', {type:'CLOSE',orders}).catch(error => console.log(error));  
    
    // const secs = Object.values(price);
    // for (const [key, value] of Object.entries(secs[0])) {
    //   const order = (await this.service.getPendingSlLeg(alertid,key))[0];
    //   const {id,order_type,symbol,order_qty} = order;
    //   await this.service.squareOff(id,value['last_price']);
    //   if(order_type == 'BUY')
    //     await this.accountService.withdraw(alertid,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${value['last_price']}`,order_qty*value['last_price']);
    //   else
    //     await this.accountService.deposit(alertid,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${value['last_price']}`,order_qty*value['last_price']);
    // }
    // const orders = await this.service.findOrderSummary(alertid);
    // await this.gateway.publishData({type:'ORDER',orders});
    // //get LTP of security and update the SL with traded status
    // //publish latest orders
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