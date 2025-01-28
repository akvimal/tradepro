import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { OrderService } from "./order.service";
import { AccountService } from "./account.service";
import { AlertGateway } from "./alert.gateway";
import { FeedService } from "./feed.service";

@Injectable()
export class OrderProcessor {
    
    constructor (private gateway:AlertGateway, private feedService:FeedService,
        private readonly orderService:OrderService, private readonly accountService:AccountService){}

    async process(orders: any) {
        console.log(`order processing ...`);
        orders.forEach(async order => {
            const {alert_id, traded_price,
                order_qty, order_type, symbol, leg, status, security_id} = order;
            // console.log(order);
            //place order
            await this.orderService.createOrder(order);
            //if new order (deduct traded amount along with some broker charges from account)
            if(status == 'TRADED'){
                if(leg == 'MAIN'){
                    await this.accountService.withdraw(alert_id,'New Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                }
                else if(leg == 'SL'){
                    await this.accountService.deposit(alert_id,'Square Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                }
            }
            
            const orders = await this.orderService.findOrderSummary(alert_id);
            await this.gateway.publishData({type:'ORDER',orders});
         
            // const payload = {
            //     RequestCode:15,
            //     InstrumentCount: 1,
            //     InstrumentList:[{ExchangeSegment:"NSE_EQ",SecurityId:security_id}]
            // };
            // console.log('subscribing new order symbol for feed');
            
            // await this.feedService.send(payload);
        });

    }

}