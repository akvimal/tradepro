import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { AlertGateway } from "src/alert.gateway";
import { PriceService } from "../prices/price.service";

@Injectable()
export class OrderProcessor {
    
    constructor (private gateway:AlertGateway,
        private readonly orderService:OrdersService, private readonly priceService:PriceService){}

    async process(request: any) {
        const {type,orders} = request;
        console.log('order processor request',request);
        
        if(type != 'NEW'||type != 'CLOSE')
            console.log('UNKNOWN Order Request Type in Order Processor');

        if(type == 'NEW'){
            await this.orderService.placeOrder(orders);
            // orders.forEach(async order => {
            //     console.log('subscribng to tcker ',order['symbol']);
                
            //     await this.priceService.subscribeTickerFeed('TICKER',order['exchange'],order['segment'],
            //         order['security_id']);
            // });
        }
        
        else if(type == 'CLOSE')
            await this.orderService.squareOff(orders);
        
        const summary = await this.orderService.getOrderSummary();
        await this.gateway.publishData({type:'ORDER',payload:summary});

    }

}