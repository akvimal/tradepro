import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment';
import { OrdersRepo } from "./orders.repo";

@Injectable()
export class OrdersService {

    constructor (private ordersRepo:OrdersRepo) {}

    async placeOrder(payload){
        return await this.ordersRepo.createOrder(payload);
    }

    async getOrderSummary(strategy:number, date=moment().format('YYYY-MM-DD')){
        let summary = [];
        summary = await this.ordersRepo.findOrderSummary(strategy,date);
        // console.log('SUMMARY: ',summary);
        return summary;
    }

    async getPendingSlLeg(alertid, security){
        return await this.ordersRepo.getPendingSlLeg(alertid, security);
    }

    async squareOff(id,price){
        return await this.ordersRepo.squareOff(id,price);
    }

    async adjustSL(security,price){
        return await this.ordersRepo.adjustSL(security,price);
    }

    async findOrders(symbol, alert_id, intraday = true){
        return await this.ordersRepo.findOrders(symbol, alert_id, intraday);
    }
}