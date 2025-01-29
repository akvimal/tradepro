import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { OrderService } from "./order.service";
import { AccountService } from "./account.service";
import { AlertGateway } from "./alert.gateway";
import { FeedService } from "./feed.service";
import { DhanService } from "./dhan.service";

@Injectable()
export class OrderProcessor {
    
    constructor (private gateway:AlertGateway, private feedService:FeedService, private dhanService:DhanService,
        private readonly orderService:OrderService, private readonly accountService:AccountService){}

    async process(request: any) {
        const {type,orders} = request;
        if(type == 'NEW'){
            console.log(`order processing ...`);
            orders.forEach(async order => {
                const {alert_id, traded_price,
                    order_qty, order_type, symbol, leg, status, security_id} = order;
                console.log(order);
                //place order
                await this.orderService.createOrder(order);
                //if new order (deduct traded amount along with some broker charges from account)
                if(leg == 'MAIN' && status == 'TRADED'){
                    // if(leg == 'MAIN'){
                    if(order_type == 'BUY')
                        await this.accountService.withdraw(alert_id,'New Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                    else
                        await this.accountService.deposit(alert_id,'New Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                    // }
                    // else if(leg == 'SL'){
                    //     await this.accountService.deposit(alert_id,'Square Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                    // }
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
        else if(type == 'CLOSE'){
            console.log('CLOSE',orders);
            const ltpBulkRequest = this.buildLtpBulkRequest(orders);
            
            const priceList = await this.dhanService.getLtp(ltpBulkRequest);
            console.log(priceList);
            orders.forEach(async order => {
                const {strategy, exchange, segment, security} = order;
                const {price} = priceList.find(p => p.security == security);
                const leg = (await this.orderService.getPendingSlLeg(strategy,security))[0];
                const {id,order_type,symbol,order_qty} = leg;
                await this.orderService.squareOff(id,price);

                if(order_type == 'BUY')
                    await this.accountService.withdraw(strategy,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
                else
                    await this.accountService.deposit(strategy,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);

                const updatedOrders = await this.orderService.findOrderSummary(strategy);
                console.log('updated orders >>> ',updatedOrders);
                
                await this.gateway.publishData({type:'ORDER',orders:updatedOrders});
            });
        }
        else 
            console.log('UNKNOWN Order Request Type in Order Processor');
            
    }


  buildLtpBulkRequest(orders){//TODO: this can be moved to partner impl
    const request = {}; //[{NSE_EQ:[100,200]}]
    orders.forEach(order => {
      const {exchange,segment,security} = order;
      const key = `${exchange}_${segment}`;
      
      const found = Object.keys(request).indexOf(key) >= 0;      
      if(found) 
        request[key].push(+security);
      else {
        request[`${key}`] = [+security];
      }
    });
    return request;
  }
}