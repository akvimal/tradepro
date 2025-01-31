import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class OrdersRepo {

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

    async getPendingSlLeg(alertid, security){
        const sql = `select * from orders where alert_id = ${alertid} and leg = 'SL' and status = 'PENDING' 
                and security_id = '${security}'`;
        return await this.manager.query(sql);
    }

    async squareOff(id,price){
        const sql = `update orders set traded_price = ${price}, status = 'TRADED' 
                where id = ${id}`;
        return await this.manager.query(sql);
    }

    async adjustSL(security,price){
        
    }

    async findOrders(symbol, alert_id, intraday){
        let sql = `select * from orders where symbol = '${symbol}' and alert_id = ${alert_id}`;
        if(intraday)
            sql += ` and date(order_dt) = current_date `;
        return await this.manager.query(sql);
    }

    async findOrderSymbols(){
        let sql = `select distinct symbol, coalesce(security_id, '') as security_id from orders where date(order_dt) = current_date`;
        return await this.manager.query(sql);
    }

    async findOrderSummary(strategy,date){
        let sql = `select alert_id as strategy, to_char(order_dt,'yyyy-mm-dd') as order_date, trend, exchange, segment, symbol, coalesce(security_id, '') as security, leg, status, trigger_price as trigger,
                sum(order_qty) as qty, avg(traded_price) as price 
                    from orders where `;
        if(date == undefined)
            sql += ` date(order_dt) = current_date`;
        else
            sql += ` date(order_dt) = '${date}'`;
        sql += ` group by alert_id, order_dt, trend, exchange, segment, symbol, security, leg, status, order_qty, traded_price, trigger_price
                    order by trend, symbol, status desc`;
       
        const trades = await this.manager.query(sql);

        const summary:{strategy:string,orders:{date:string,bullish:any[],bearish:any[]}}[] = [];

        trades.filter(o => o.leg == 'MAIN' && o.status == 'TRADED').forEach(order => {
            const {strategy,trend,symbol,exchange, segment,order_date,security,qty,price,trigger} = order;
            const found = summary.find(st => st.strategy == strategy);
            const orderSummary = {symbol,exchange,segment,security,qty,balance:qty,price,trigger};
            if(trend == 'Bullish'){ 
                found ? found['orders'].bullish.push(orderSummary) : 
                    summary.push({strategy,orders:{date:order_date,bullish:[orderSummary],bearish:[]}});
            }
            if(trend == 'Bearish'){ 
                found ? found['orders'].bearish.push(orderSummary) : 
                    summary.push({strategy,orders:{date:order_date,bullish:[],bearish:[orderSummary]}});
            }
        });
        
        summary.forEach(st => {
            const {strategy} = st;
            const {date} = st['orders'];
            this.updateOrderBalance(trades, st['orders']['bullish'], strategy,date,'Bullish');
            this.updateOrderBalance(trades, st['orders']['bearish'], strategy,date,'Bearish');
        });
        
        return summary;
    }

    updateOrderBalance(trades, orders, strategy,date,trend){
        orders.forEach(order => {
            const found = trades.find(o => o.strategy == strategy && o.order_date == date && 
                o.trend == trend && o.symbol == order.symbol && o.leg == 'SL');
            if(found){
                if(found['status']=='TRADED'){
                    order['balance'] -= +found['qty'];
                    order['exit'] = found['price'];
                }
                order['trigger'] = found['trigger'];
            }
        });
    }

}