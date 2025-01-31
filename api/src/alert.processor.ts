import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment-timezone';
import { AlertService } from "./alert.service";
import { RabbitMQService } from "./common/rabbitmq.service";
import { AccountService } from "./account.service";
import { MasterService } from "./master.service";
import { OrdersService } from "./modules/orders/orders.service";

@Injectable()
export class AlertProcessor {
    
    constructor (private readonly mqService: RabbitMQService,
        private readonly alertService:AlertService, 
        private readonly accountService: AccountService,
        private readonly orderService:OrdersService,
        private readonly masterService:MasterService){}

    async process(content: any) {
        // console.log(`alert processing ...`);
        console.log(content);
        const {alertid,direction,provider,stocks,trigger_prices} = content;
        if(provider === 'chartink'){
            const alert = await this.alertService.findOne(alertid);
            const {exchange,segment,instrument} = alert['config'];

            if(alert && alert.active){
                
                const account = (await this.accountService.findByAlert(alert.id))[0];
                if(account == undefined || account.balance <= 0){
                    console.log(`insufficient balance for alert ${alert.id}`);
                    return;
                }

                if((direction === 'Bullish' && alert.buy) || (direction == 'Bearish' && alert.sell)) {
                
                    const symbols = stocks.split(',');
                    const prices = trigger_prices.split(',');
                    for (let index = 0; index < symbols.length; index++) {
                        const symbol = symbols[index];
                        const price = prices[index];
                        console.log(`processing alert for ${symbol} at ${price}`);
                        let proceed = true;
                        const exOrders = await this.orderService.findOrders(symbol, alert.id);
                        // console.log(exOrders);
                        if(exOrders.length > 0){
                            let bought = 0, sold = 0;
                            // console.log(`existing orders found for ${symbol}`);
                            exOrders.filter(o => o['order_type'] === 'BUY' && o['status'] == 'TRADED').map(o => bought += o['order_qty']);
                            exOrders.filter(o => o['order_type'] === 'SELL' && o['status'] == 'TRADED').map(o => sold += o['order_qty']);
                            proceed = (bought - sold) === 0;
                        }
                        // for same direction signal and unsold order qty exists for the day, then ignore
                        // for opposite direction signal and unsold order qty exists for the day, then square off (update SL leg to market)
                        if(proceed){
                            const secInfo = (await this.masterService.findSecurityInfo(exchange,segment,symbol))[0];
                            const orders = this.buildOrderRequest(alert, account['balance'], direction, symbol, secInfo['security_id'], price);
                            await this.mqService.publishMessage('orderQueue', {type:'NEW',orders}).catch(error => console.log(error));  
                        }
                    }
                }
            }
        } 
        //parse the stocks and prices
        //get the alert configuration (active, buy/sell, virtual/real)
        //get the order configuration (instrument, qty, price, )
        //post message to the order queue for each stock
    }

    buildOrderRequest(alert, capital, direction, symbol, secId, price){
        // console.log(alert);
        const {exchange,segment,instrument,order,intraday} = alert['config'];
        let qty = 0;
        //TODO: should check for atleast one qty, otherwise throw error (insufficient capital)
        const orders = [];
        const orderTemplate = {
            exchange,segment,instrument,
                    alert_id: alert.id,
                    order_dt: moment().format('YYYY-MM-DD HH:mm:ss'),
                    symbol,
                    security_id: secId,
                    trend: direction,
                    delivery_type: intraday == undefined ? 'CNC' : 'INTRADAY'
        };
        const trade = direction === 'Bullish' ? 'BUY' : 'SELL'; //will change for options
        order.forEach(o => {
            const {limit,position,leg} = o;
            if( leg =='MAIN'){
                qty = Math.floor((capital*position['pcnt']/100)/price);
                orders.push({
                    ...orderTemplate, leg,
                    order_type: trade,
                    traded_price: price,
                    order_qty: qty, 
                    status: alert['virtual'] ? 'TRADED' : 'NEW',
                    entry_type: limit == undefined ? 'MARKET' : 'LIMIT',
                    
                });
            }
            if(leg == 'SL'){
                const sldiff = o['limit']['pcnt']/100;
                orders.push({
                    ...orderTemplate, leg,
                    order_type: trade === 'BUY' ? 'SELL' : 'BUY',
                    trigger_price: price * (trade === 'BUY' ? (1 - sldiff) : (1 + sldiff)),
                    order_qty: qty, 
                    status: alert['virtual'] ? 'PENDING' : 'NEW',
                    entry_type: limit == undefined ? 'MARKET' : 'LIMIT'
                });
            }
        })
        return orders;
    }
}