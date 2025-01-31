import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { AlertGateway } from "src/alert.gateway";
import { DhanService } from "src/dhan.service";
import { AccountService } from "src/account.service";

@Injectable()
export class OrderProcessor {
    
    constructor (private gateway:AlertGateway, private dhanService:DhanService,
        private readonly orderService:OrdersService, private readonly accountService:AccountService){}

    async process(request: any) {
        const {type,orders} = request;
        console.log('order processor request',request);
        
        try {
        if(type == 'NEW'){
            
            orders.forEach(async order => {
                const {alert_id, traded_price,
                    order_qty, order_type, symbol, leg, status, security_id} = order;
                console.log(order);
                //place order
                await this.orderService.placeOrder(order);
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
                
                const summary = await this.orderService.getOrderSummary(alert_id);
                console.log('order summary before publishing:',summary);
                
                await this.gateway.publishData({type:'ORDER',payload:summary});
            
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
            // console.log('CLOSE',orders);
            const ltpBulkRequest = this.buildLtpBulkRequest(orders);
            
            const priceList = await this.dhanService.getLtp(ltpBulkRequest);
            // console.log(priceList);
            orders.forEach(async order => {
                const {strategy, exchange, segment, security} = order;
                const {price} = priceList.find(p => p.security == security);
                const leg = (await this.orderService.getPendingSlLeg(strategy,security))[0];
                if(leg){
                    const {id,order_type,symbol,order_qty} = leg;
                    await this.orderService.squareOff(id,price);

                    if(order_type == 'BUY')
                        await this.accountService.withdraw(strategy,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
                    else
                        await this.accountService.deposit(strategy,'Square Off',`${order_type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);

                    const summary = await this.orderService.getOrderSummary(strategy);
                    await this.gateway.publishData({type:'ORDER',payload:summary});
                }
            });
        }
        else 
            console.log('UNKNOWN Order Request Type in Order Processor');
        } catch (error) {
            console.log('Unable to process: ',request);
            
        }
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