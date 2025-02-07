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

    async placeOrder(strategy,orders){

        await this.ordersRepo.placeOrder(strategy,orders);

    }

    async getBalanceByStrategy(id:number){
        const days = await this.ordersRepo.getStrategyBalanceByDay(id);
        // console.log('days',days);
        let pnl = 0;
        days.forEach(dt => {
            pnl += dt['pnl'];
        });
        const today = await this.ordersRepo.getStrategyBalanceToday(id);
        // console.log('today',today);
        const todayPositions = [];
        for (let index = 0; index < today.length; index++) {
            const trade = today[index];
            const found = todayPositions.find(o => o['security_id'] == trade['security_id']);
            if(!found) {
                todayPositions.push(trade);
            }
            else if (found['status'] == 'PENDING' && trade['status'] == 'TRADED'){
                found['price'] = trade['traded_price'];
                found['realized'] = false;
            } else if (found['status'] == 'TRADED' && trade['status'] == 'TRADED'){
                found['pnl'] = Math.round((found['order_type'] == 'SELL' ? (found['traded_price']-trade['traded_price']) : (trade['traded_price']-found['traded_price']))* found['order_qty']);
                found['realized'] = true;
            }
        }

        return {pnl,days,positions:todayPositions}
    }

    async getOrderSummary(date=moment().format('YYYY-MM-DD')){
        return await this.ordersRepo.findOrderSummary(date);
    }

    async getPendingSlLeg(alertid, type, security){
        return await this.ordersRepo.getPendingSlLeg(alertid, type, security);
    }

    async handlePriceChange(security,ltp){
        //get the pending SL legs with strategy config
        console.log(`Security[${security}] LTP[${ltp}]`);
        const slleg = await this.ordersRepo.getTrailSlLeg(security);
        if(slleg){
            const {alertId,trail,triggerPrice,orderType,alert} = slleg;
                //if price breached SL, square off
            if((orderType == 'BUY' && ltp > triggerPrice)||(orderType == 'SELL' && ltp < triggerPrice)){
                // console.log('squaring off');
                await this.squareOffSingle(slleg, ltp);
            }
            const {config} = alert;
                //if price advanced (greater than SL %) and trail flag is on, update trigger price by trail %
                
            const sl = config['order']['cover']['sl'];
            const {units,value} = sl;
            if(units=='PCNT'){
                const newTriggerPrice = orderType == 'BUY' ? (ltp * (1+value)) : (ltp * (1-value));
                if(trail && sl['trail'] && ((orderType == 'BUY' && newTriggerPrice < triggerPrice)||
                    (orderType == 'SELL' && newTriggerPrice > triggerPrice))){
                    await this.ordersRepo.updateSLTrail(alertId,security,newTriggerPrice);
                }
            }
        }
    }

    async squareOff(orders){        
        const priceList = await this.getLtp(orders);
        const slOrders = [];
        const legs = await this.ordersRepo.getPendingSlLegs(3, orders.map(o => o['security']));
        
        for (let index = 0; index < legs.length; index++) {
            const sl = legs[index];
            const {price} = priceList.find(p => p.security == sl['securityId']);
            sl['tradedPrice'] = price;
            sl['status'] = 'TRADED';
            slOrders.push(sl); 
        }
        
        await this.ordersRepo.squareOffOrders(slOrders);
           
    }

    async squareOffSingle(order,price){        

        const {id,strategy,type,symbol,order_qty} = order;
        await this.ordersRepo.squareOff(strategy,id,price);

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
    // async adjustSL(security,price){
    //     return await this.ordersRepo.adjustSL(security,price);
    // }

    async findOrders(symbol, strategyId, intraday = true){
        return await this.ordersRepo.findOrders(symbol, strategyId, intraday);
    }

    async findOrderBySecurity(strategyId:number,security:string,position:string,intraday:boolean){
        return await this.ordersRepo.findOrderBySecurity(strategyId,security,position,intraday);
    }
}