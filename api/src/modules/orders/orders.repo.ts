import { Inject, Injectable, LoggerService } from "@nestjs/common";
import * as moment from 'moment-timezone';
import { InjectEntityManager } from "@nestjs/typeorm";
import { Account } from "src/entities/account.entity";
import { Order } from "src/entities/order.entity";
import { Transaction } from "src/entities/transaction.entity";
import { EntityManager, In } from "typeorm";

@Injectable()
export class OrdersRepo {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async placeOrder(strategy,orders){
        
        await this.manager.transaction(async (manager) => {
            const account = await manager.findOne(Account,{where :{alertId:strategy['id']}});
            for (const order of orders) {
                
                await manager.save(Order, order);

                if(order['leg'] == 'MAIN'){
                    const desc = `${order['orderType']} [${order['symbol']}] QTY: ${order['orderQty']} Price: ${order['tradedPrice']}`;
                    const amount = order['orderQty'] * order['tradedPrice'];
                    
                    await manager.save(Transaction, {accountId:account['id'],description:desc,category:'New Trade',withdraw:amount});
                    
                    account['balance'] = account['balance'] - amount;
                    account['updatedOn'] = moment().format('YYYY-MM-DD HH:mm:ssZ');
                    
                    await manager.save(Account, account);
                }
            }
        });
    }

    async getPendingSlLegs(alertId, securityIds){
        return await this.manager.find(Order, {where:{alertId,leg:'SL',status:'PENDING',securityId: In(securityIds)}});
    }

    async getPendingSlLeg(alertId, type, securityId){
        return await this.manager.findOne(Order, {where:{alertId,orderType:type,leg:'SL',status:'PENDING',securityId}});
    }

    async getTrailSlLeg(securityId){
        return await this.manager.findOne(Order, {where:{leg:'SL',status:'PENDING',securityId},relations: ['alert']});
    }

    async updateSLTrail(strategy,security,price){        
        const sql = `update orders set trigger_price = ${price} where alert_id = ${strategy} 
        and security_id = '${security}' 
        and leg = 'SL' 
        and status = 'PENDING'`;
        return await this.manager.query(sql);
    }

    async getPendingExchangeIntradayOrders(exchange){
        const sql = `select exchange, segment, security_id as security, alert_id as strategy from orders where exchange = '${exchange}' and leg = 'SL' and status = 'PENDING' and date(order_dt) = current_date`;
        return await this.manager.query(sql);
    }

    async squareOffOrders(orders){
        await this.manager.transaction(async (manager) => {
            for (const order of orders) {
                await manager.update(Order, {id:order['id']},order);
                    const account = await manager.findOne(Account,{where :{alertId:order['strategy']}});
                    const desc = `${order['orderType']} [${order['symbol']}] QTY: ${order['orderQty']} Price: ${order['tradedPrice']}`;
                    const amount = order['orderQty'] * order['tradedPrice'];
                    
                    await manager.save(Transaction, {accountId:account['id'],description:desc,category:'Close Trade',deposit:amount});
                    
                    account['balance'] = account['balance'] + amount;
                    account['updatedOn'] = moment().format('YYYY-MM-DD HH:mm:ssZ');
                    
                    await manager.save(Account, account);
            }
        });
    }

    async squareOff(strategy,id,price){
        // console.log('>>>> stra',strategy);
        await this.manager.transaction(async (manager) => {
        // const account = await manager.findOne(Account,{where :{alertId:strategy}});
        // console.log(account);
        
        const sql = `update orders set traded_price = ${price}, status = 'TRADED' 
                where id = ${id}`;
            return await this.manager.query(sql);
        });
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

    async getStrategyBalanceByDay(id:number){
        const sql = `WITH traded_summary AS (
                                SELECT
                                    to_char(order_dt,'YYYY-MM-DD') as date,
                                    SUM(CASE WHEN order_type = 'SELL' THEN order_qty * traded_price END) -
                                    SUM(CASE WHEN order_type = 'BUY' THEN order_qty * traded_price END) AS pnl
                                    from orders
                                    where alert_id = ${id} and date(order_dt) < CURRENT_DATE AND status = 'TRADED'
                                    GROUP BY order_dt)
                            SELECT 
                                ts.date, 
                                round(COALESCE(ts.pnl, 0)) AS pnl
                            FROM traded_summary ts
                            ORDER BY ts.date`;
        return await this.manager.query(sql);
    }

    async getStrategyBalanceToday(id:number){
        const sql = `select security_id, status, traded_price, order_type, order_qty
                    from orders
                    where alert_id = ${id} and date(order_dt) = CURRENT_DATE AND status in ('PENDING','TRADED')
                    order by security_id, status`;
        return await this.manager.query(sql);
    }

    async findOrderSummary(date){
        let sql = `select alert_id as strategy, order_type, to_char(convert_utc_to_asia_time(order_dt),'yyyy-mm-dd') as order_date,
        to_char(convert_utc_to_asia_time(order_dt),'HH24:MI') as order_time, trend, exchange, segment, symbol, coalesce(security_id, '') as security, leg, status, trigger_price as trigger,
                sum(order_qty) as qty, avg(traded_price) as price 
                    from orders where `;
        if(date == undefined)
            sql += ` date(convert_utc_to_asia_time(order_dt)) = convert_utc_to_asia_time(current_date)`;
        else
            sql += ` date(convert_utc_to_asia_time(order_dt)) = '${date}'`;
        sql += ` group by alert_id, order_type, order_dt, trend, exchange, segment, symbol, security, leg, status, order_qty, traded_price, trigger_price
                    order by order_dt, trend, symbol, status `;
       
        // console.log(`Date: ${date} \nSQL: ${sql}`);
                    
        const trades = await this.manager.query(sql);

        const summary:{strategy:string,orders:{date:string,bullish:any[],bearish:any[]}}[] = [];

        trades.filter(o => o.leg == 'MAIN' && o.status == 'TRADED').forEach(order => {
            // console.log(order);
            
            const {strategy,trend,symbol,exchange, order_type, segment,order_date,order_time,security,qty,price,trigger} = order;
            const found = summary.find(st => st.strategy == strategy);
            const orderSummary = {symbol,date:`${order_date} ${order_time}`,time:order_time,order_type,exchange,segment,security,qty,balance:qty,price,trigger};
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
            const found = trades.find(o => o.strategy == strategy && o.order_date == date && o.order_time == order['time'] && 
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

    async findOrderBySecurity(strategyId:number,security:string,position:string, intraday:boolean){
        let sql = `select * from orders where alert_id = ${strategyId} and security_id = '${security}' and order_type = '${position}'
         and status in ('TRANSIT','PENDING','TRADED')`;
        if(intraday) sql += ` and date(order_dt) = current_date`;
        return this.manager.query(sql);
    }
}