import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import * as moment from 'moment';

@Injectable()
export class OrderService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async createOrder(payload){
        const cols = [];
        cols.push('exchange');
        cols.push('segment');
        cols.push('instrument');
        cols.push('alert_id');
        cols.push('order_dt');
        cols.push('symbol');
        cols.push('security_id');
        cols.push('order_type');
        cols.push('order_qty');
        cols.push('status');
        cols.push('trend');
        cols.push('entry_type');
        cols.push('delivery_type');
        cols.push('leg');

        if(payload['traded_price']) 
            cols.push('traded_price');
        if(payload['trigger_price']) 
            cols.push('trigger_price');

        const vals = [];
        vals.push(`'${payload.exchange}'`);
        vals.push(`'${payload.segment}'`);
        vals.push(`'${payload.instrument}'`);
        vals.push(`${payload.alert_id}`);
        vals.push(`'${payload.order_dt}'`);
        vals.push(`'${payload.symbol}'`);
        vals.push(`'${payload.security_id}'`);
        vals.push(`'${payload.order_type}'`);
        vals.push(`${payload.order_qty}`);
        vals.push(`'${payload.status}'`);
        vals.push(`'${payload.trend}'`);
        vals.push(`'${payload.entry_type}'`);
        vals.push(`'${payload.delivery_type}'`);
        vals.push(`'${payload.leg}'`);

        if(payload['traded_price']) 
            vals.push(`${payload.traded_price}`);
        if(payload['trigger_price']) 
            vals.push(`${payload.trigger_price}`);

        const sql = `insert into orders (${cols.join(',')}) values (${vals.join(',')})`;
        try {
            await this.manager.query(sql);
        } catch (error) {
            console.log(error);
        }
    }

    async squareOff(security,price){
        console.log('to sqr', security + ' ' + price);
        const sql = `update orders set traded_price = ${price}, status = 'TRADED' where security_id = '${security}' and leg = 'SL'`;
        try {
            await this.manager.query(sql);
        } catch (error) {
            console.log(error);
        }
    }

    async adjustSL(security,price){
        
    }

    async findOrders(symbol, alert_id, intraday = true){
        let sql = `select * from orders where symbol = '${symbol}' and alert_id = ${alert_id}`;
        if(intraday)
            sql += ` and date(order_dt) = current_date `;
        return await this.manager.query(sql);
    }

    async findOrderSymbols(){
        let sql = `select distinct symbol, coalesce(security_id, '') as security_id from orders where date(order_dt) = current_date`;
        return await this.manager.query(sql);
    }

    async findOrderSummary(alertid,date=moment().format('YYYY-MM-DD')){
        let sql = `select trend, exchange, segment, symbol, coalesce(security_id, '') as security, leg, status, trigger_price as trigger,
                sum(order_qty) as qty, avg(traded_price) as price 
                    from orders where alert_id = ${alertid}`;
        if(date == undefined)
            sql += ` and date(order_dt) = current_date`;
        else
            sql += ` and date(order_dt) = '${date}'`;
        sql += ` group by trend, exchange, segment, symbol, security, leg, status, order_dt, order_qty, traded_price, trigger_price
                    order by trend, symbol, status desc`;
       
        const orders = await this.manager.query(sql);
        const summary = {bullish: [], bearish: []}
        orders.filter(o => o.leg == 'MAIN' && o.status == 'TRADED').forEach(order => {
            const {trend,symbol,exchange, segment,order_type,security,qty,price,trigger} = order;
            if(trend == 'Bullish'){ 
                //if already exists add qty
                summary.bullish.push({symbol,exchange,segment,security,qty,balance:qty,price,trigger})
            }
            if(trend == 'Bearish'){ 
                summary.bearish.push({symbol,exchange,segment,security,qty,balance:qty,price,trigger})
            }
        });

        summary.bullish.forEach(bull => {
            const found = orders.find(o => o.trend=='Bullish' && o.symbol == bull.symbol && o.leg == 'SL');
            if(found){
                if(found['status']=='TRADED'){
                    bull['balance'] -= found['qty'];
                    bull['exit'] = found['price'];
                }
                bull['trigger'] = found['trigger'];
            }
        });

        summary.bearish.forEach(bear => {
            const found = orders.find(o => o.trend=='Bearish' && o.symbol == bear.symbol && o.leg == 'SL');
            if(found){
                if(found['status']=='TRADED'){
                    bear['balance'] -= found['qty'];
                    bear['exit'] = found['price'];
                }
                bear['trigger'] = found['trigger'];
            }
        });
        
        return summary;
    }
}