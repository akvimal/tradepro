import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment';
import { OrdersRepo } from "./orders.repo";
import { AccountService } from "src/modules/accounts/account.service";
import { PriceService } from "../price/price.service";
import { DhanService } from "../common/dhan.service";
import { AppConfigService } from "../common/app-config.service";

@Injectable()
export class OrdersService {

    constructor (
        private readonly dhanService: DhanService,
              private readonly appConfigService: AppConfigService,
        private ordersRepo:OrdersRepo, 
        // private readonly priceService:PriceService, 
        private readonly accountService:AccountService
    ) {}

    async placeOrder(orders){
        // return await this.ordersRepo.createOrder(payload);
        orders.forEach(async order => {
            
            const {alert_id, traded_price, exchange, segment,
                order_qty, order_type, symbol, leg, status, security_id} = order;
            // console.log(order);
            //place order
            await this.ordersRepo.createOrder(order);
            //if new order (deduct traded amount along with some broker charges from account)
            if(leg == 'MAIN' && status == 'TRADED'){
                if(order_type == 'BUY')
                    await this.accountService.withdraw(alert_id,'New Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
                else
                    await this.accountService.deposit(alert_id,'New Trade', `${order_type} ${symbol} QTY: ${order_qty} Price: ${traded_price}`, order_qty*traded_price);
            }
        });
    }

    async getOrderSummary(date=moment().format('YYYY-MM-DD')){
        let summary = [];
        summary = await this.ordersRepo.findOrderSummary(date);
        // console.log('SUMMARY: ',summary);
        return summary;
    }

    async getPendingSlLeg(alertid, type, exchange, segment, security){
        return await this.ordersRepo.getPendingSlLeg(alertid, type, exchange, segment, security);
    }

    async handlePriceChange(security,ltp){
        //get the pending SL legs with strategy config
      const sllegs = await this.ordersRepo.getTrailSlLeg(security);
      sllegs.forEach(async slleg => {
        const {strategy,trail,trigger_price,config,type} = slleg;
        //if price breached SL, square off
        if((type == 'BUY' && ltp > trigger_price)||(type == 'SELL' && ltp < trigger_price))
            await this.squareOffSingle(slleg, ltp);

        //if price advanced (greater than SL %) and trail flag is on, update trigger price by trail %
        const sl = config['order'].find(c=> c.leg == 'SL');
        const pcnt = sl['limit']['pcnt']/100;
        const newTriggerPrice = type == 'BUY' ? (trigger_price * (1-pcnt)) : (trigger_price * (1+pcnt));
        console.log(`pcnt: ${pcnt} trigger: ${newTriggerPrice}`);
        
        if((type == 'BUY' && ltp < newTriggerPrice)||
            (type == 'SELL' && ltp > newTriggerPrice))
            await this.ordersRepo.updateSLTrail(strategy,security,newTriggerPrice);
      });
      
    }

    // async updateSLTrail(security,ltp){
    //     const leg = await this.ordersRepo.getTrailSlLeg(security);
    //     const {strategy,trail,trigger_price,config,type} = leg;
    //     if(trail){
    //         const sl = config['order'].find(c=> c.leg == 'SL');
    //         if(sl){
    //             const pcnt = sl['limit']['pcnt'];
    //             let newTriggerPrice = 0;
    //             if(type == 'SELL')
    //                 newTriggerPrice = +ltp * ( 1 - (+pcnt/100));
    //             else
    //                 newTriggerPrice = +ltp * ( 1 + (+pcnt/100));
    //             //update SL
    //             await this.ordersRepo.updateSLTrail(strategy,security,newTriggerPrice);
    //         }
    //     }
    // }

    async squareOff(orders){        
        const priceList = await this.getLtp(orders);
        orders.forEach(async order => {
            const {strategy, type, exchange, segment, security} = order;
            const {price} = priceList.find(p => p.security == order['security']);

            const leg = (await this.getPendingSlLeg(strategy, type, exchange, segment,security))[0];
                if(leg){
                    const {id,symbol,order_qty} = leg;
                    await this.ordersRepo.squareOff(id,price);

                    if(type == 'BUY')
                        await this.accountService.withdraw(strategy,'Square Off',`${type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
                    else
                        await this.accountService.deposit(strategy,'Square Off',`${type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
                }
            });
    }

    async squareOffSingle(order,price){        

        const {id,strategy,type,symbol,order_qty} = order;
        await this.ordersRepo.squareOff(id,price);

        if(type == 'BUY')
            await this.accountService.withdraw(strategy,'Square Off',`${type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
        else
            await this.accountService.deposit(strategy,'Square Off',`${type} ${symbol} QTY: ${order_qty} PRICE: ${price}`,order_qty*price);
    }

    async getLtp(orders){
        const partner = await this.appConfigService.getPartnerInfo('Dhan');
        return await this.dhanService.getLtp(this.buildLtpBulkRequest(orders),partner);
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
    async adjustSL(security,price){
        return await this.ordersRepo.adjustSL(security,price);
    }

    async findOrders(symbol, alert_id, intraday = true){
        return await this.ordersRepo.findOrders(symbol, alert_id, intraday);
    }
}