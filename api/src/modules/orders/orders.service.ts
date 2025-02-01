import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment';
import { OrdersRepo } from "./orders.repo";
import { AccountService } from "src/account.service";
import { PriceService } from "../prices/price.service";

@Injectable()
export class OrdersService {

    constructor (private ordersRepo:OrdersRepo, private readonly priceService:PriceService, private readonly accountService:AccountService) {}

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

    async squareOff(orders){        
        const priceList = await this.priceService.getLtp(orders);
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

    async adjustSL(security,price){
        return await this.ordersRepo.adjustSL(security,price);
    }

    async findOrders(symbol, alert_id, intraday = true){
        return await this.ordersRepo.findOrders(symbol, alert_id, intraday);
    }
}