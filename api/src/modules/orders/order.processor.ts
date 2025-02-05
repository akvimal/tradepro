import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment-timezone';

import { AlertGateway } from "src/modules/common/alert.gateway";
import { OrdersService } from "./orders.service";
import { PriceService } from "src/modules/price/price.service";
import { MasterService } from "../common/master.service";
import { Constants } from "../common/constants";
import { Order } from "src/entities/order.entity";
import { AccountService } from "../accounts/account.service";

@Injectable()
export class OrderProcessor {

    expiry = ["2025-02-27","2025-03-27","2025-04-24"]
    
    constructor (
        private gateway: AlertGateway,
        private readonly orderService: OrdersService,
        private readonly accountService: AccountService,
        private readonly priceService: PriceService,
        private readonly masterService: MasterService
    ){}

    async process(request: any) {
        const {type} = request;
       
        console.log('type:',type);
        // console.log('payload:',payload);
        if(type == 'NEW'){
            const {symbol,price,strategy,direction} = request['payload'];
            const {config,balance,virtual,interval,frequency,capital} = strategy;
            const {exchange,segment,instrument,intraday,option,order} = config;
            
            const {begin,end,squareoff} = intraday;
            if(instrument.startsWith('OPT')){
                const {buy,lots,moneyness} = option;
                const contractType = this.getOptionContractType(direction);
                const secInfo = (await this.masterService.getOptionSecurityId(exchange,
                            segment, symbol, this.expiry[0], price, contractType, +moneyness));
                const {security_id, opt_symbol, strike_price, lot_size} = secInfo;
                // console.log(secInfo);
                const orders = await this.orderService.findOrderBySecurity(strategy['id'],security_id,
                    this.getOptionOrderType(buy),
                    intraday!==undefined);
                // console.log(`Orders found: ${orders.length}`);
                if(!this.isPendingQtyInOrders(orders)){
                
                    if(virtual && order['type']=='MARKET'){
                        //get LTP of security
                        const priceList = await this.priceService.getLtp([{exchange,segment,security:security_id}]);
                        console.log(`LTP[${security_id}]: ${priceList[0].price}`);
                        const ltp = priceList[0].price;
                        //for options use lotsize
                        const {position,cover} = order;
                        const totalCostPerLot = ltp * lot_size;
                        let totalCostAllLots = 0;
                        // console.log('Capital: ',capital);
                        let qty = 0;
                        let actualLots = 0;
                        if(position['units']=='PCNT'){
                            const fundAllowed = capital * (position['value']/100);
                            if(lots > 0){
                                totalCostAllLots = totalCostPerLot * lots;
                                const totalLots = fundAllowed/totalCostAllLots;
                                actualLots = Math.round(totalLots);
                                qty = actualLots * lot_size;
                            }
                        }
                        // console.log(qty);        
                        let slTriggerPrice = 0;
                        const {type,sl} = cover;
                        if(sl['units']=='PCNT'){
                            slTriggerPrice = ltp * (buy ? (1-(sl['value']/100)):(1+(sl['value']/100)));
                        }
                        // console.log('trigger price',slTriggerPrice);
                        
                        const orders = this.buildOrderRequest(strategy,opt_symbol, security_id,  direction, qty, ltp, slTriggerPrice,sl['trail'],buy);
                        
                        //place order of all legs
                        await this.orderService.placeOrder(strategy,orders);
                        //update accounts with cost for the actual qty
                
                        // await this.accountService.withdraw(strategy['id'],'New Trade', `${this.getOptionOrderType(buy)} [${opt_symbol}] QTY: ${qty} Price: ${ltp}`,qty * ltp);

                       
                    }
                } else {
                    //Ignored now, may accumulate more positions later
                }
            }
        } else if(type === 'CLOSE'){
                // const priceList = await this.priceService.getLtp(orders);
                await this.orderService.squareOff(request['orders']);
        } else {
                console.log(`UNKNOWN Order Request Type[${type}] in Order Processor`);
        }
        const summary = await this.orderService.getOrderSummary();
        await this.gateway.publishData({type:'ORDER',payload:summary});    
        // setTimeout(async () => { //Hack
        //     const summary = await this.orderService.getOrderSummary();
        //     await this.gateway.publishData({type:'ORDER',payload:summary});    
        // }, 100);
  
    }

    buildOrderRequest(strategy, symbol, secId, direction, qty, price, triggerPrice, trail, buy){
            const {exchange,segment,instrument,order,intraday} = strategy['config'];
            const orders:Order[] = [];
           
            const orderTemplate = {
                    exchange,
                    segment,
                    instrument,
                    alertId: strategy.id,
                    orderDt: moment().utc().toLocaleString(),
                    symbol,
                    securityId: secId,
                    orderQty: qty, 
                        trend: direction,
                        deliveryType: intraday == undefined ? 'CNC' : 'INTRADAY'
            };
            const trade = buy ? 'BUY' : 'SELL'; //will change for options
            
            orders.push({
                ...orderTemplate, leg:'MAIN',
                orderType: trade,
                tradedPrice: price,
                
                trail: false,
                status: strategy['virtual'] ? 'TRADED' : 'NEW',
                entryType: price == undefined ? 'MARKET' : 'LIMIT',
            });
            if(order['cover']!==undefined){
                orders.push({
                    ...orderTemplate, leg: 'SL',
                    orderType: trade === 'BUY' ? 'SELL' : 'BUY',
                    triggerPrice: triggerPrice,
                    trail,
                    status: strategy['virtual'] ? 'PENDING' : 'NEW',
                    entryType: triggerPrice == undefined ? 'MARKET' : 'LIMIT'
                });
            }
            return orders;
        }

    async handlePriceFeed(content){
        await this.orderService.handlePriceChange(content['security'],content['ltp']);
    }

    isPendingQtyInOrders(orders){
        
        let bought = 0, sold = 0;
        // console.log(`existing orders found for ${symbol}`);
        orders.filter(o => o['order_type'] === 'BUY' && o['status'] == 'TRADED').map(o => bought += o['order_qty']);
        orders.filter(o => o['order_type'] === 'SELL' && o['status'] == 'TRADED').map(o => sold += o['order_qty']);
       
        return (bought - sold) > 0;
    }

    getOptionOrderType(buyer){
        return buyer ? Constants.ORDER_BUY : Constants.ORDER_SELL;
    }

    getOptionContractType(direction){
        return direction == Constants.DIRECTION_BULL ? Constants.OPTION_CALL : Constants.OPTION_PUT;
    }
}