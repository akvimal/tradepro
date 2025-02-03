import { Inject, Injectable, LoggerService } from "@nestjs/common";

import { AlertGateway } from "src/modules/common/alert.gateway";
import { OrdersService } from "./orders.service";
import { PriceService } from "src/modules/price/price.service";

@Injectable()
export class OrderProcessor {
    
    constructor (
        private gateway:AlertGateway,
        private readonly orderService:OrdersService,
        // private readonly priceService:PriceService
    ){}

    async process(request: any) {
        const {type,orders} = request;
        console.log('order processor request type:',type);
        
        if(type !== 'NEW'||type !== 'CLOSE')
            console.log('UNKNOWN Order Request Type in Order Processor');

        if(type === 'NEW'){
            await this.orderService.placeOrder(orders);
        }
        
        else if(type === 'CLOSE'){
            // const priceList = await this.priceService.getLtp(orders);
            await this.orderService.squareOff(orders);
        }
        
        setTimeout(async () => { //Hack
            const summary = await this.orderService.getOrderSummary();
            await this.gateway.publishData({type:'ORDER',payload:summary});    
        }, 100);
  
    }

    async handlePriceFeed(content){
        
        await this.orderService.handlePriceChange(content['security'],content['ltp']);

    }

}