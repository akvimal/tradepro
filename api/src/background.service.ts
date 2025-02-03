import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import { OrderProcessor } from './modules/orders/order.processor';
import { OrdersService } from './modules/orders/orders.service';
import { PriceService } from './modules/price/price.service';

@Injectable()
export class BackgroundService {
  
  private readonly logger = new Logger(BackgroundService.name);

  exchanges = [{exchange:'NSE',active:false,squareoff:false,session:{open:'09:15',close:'15:30'},intraday:{squareoff:'15:19'}}]

  constructor(private readonly orderProcessor:OrderProcessor,
    private readonly orderService:OrdersService,
    private readonly priceService:PriceService
  ){}

  @Cron(CronExpression.EVERY_MINUTE)
  // @Cron(CronExpression.EVERY_5_SECONDS)
  async hearBeat() {
    const exch = this.exchanges.find(ex => ex['exchange'] == 'NSE')
    const {exchange,squareoff,session,intraday} = exch;
    const timeNow = moment().format('HH:mm');
    console.log(`Now:[${timeNow}] Open:[${session['open']}] Close:[${session['close']}] Sqr:[${intraday['squareoff']}]`);
    
      if(timeNow === session['open']){
        console.log(`Exchange[${exchange}] Opened`);
        exch['squareoff'] = false;
      }

      if(!squareoff && timeNow === intraday['squareoff']){
        console.log(`Exchange[${exchange}] Squared Off triggered`);  
        const orders = await this.orderService.getOrderSummary();
        const pendingOrders = [];
        orders.forEach(order => {
          const {strategy} = order;
          pendingOrders.push(order['orders']['bullish'].filter(o => o.exchange == exchange && +o.balance > 0)
            .map((o:any) => {return {type:'SELL',strategy,exchange:o['exchange'],segment:o['segment'],security:o['security']}}));
          pendingOrders.push(order['orders']['bearish'].filter(o => o.exchange == exchange && +o.balance > 0)
            .map((o:any) => {return {type:'BUY',strategy,exchange:o['exchange'],segment:o['segment'],security:o['security']}}));  
        });
        
        // console.log(pendingOrders);
        
        this.orderProcessor.process({type:'CLOSE',orders:pendingOrders.flat(1)})
        exch['squareoff'] = true;
      }
      // console.log(moment(timeNow).isSame(session['close']));
      
      if(timeNow === session['close']){
        // console.log(`Exchange[${exchange}] Closed`);
        this.priceService.unsubscribeFeed('TICKER');
      }
    
  }

  isTimeLapsed(input: string): boolean {
    const currentTime = moment().format('HH:mm'); // Get system time in HH:mm format
    // console.log(`${moment(currentTime, 'HH:mm')} > ${moment(givenTime, 'HH:mm')}`);
    return moment(currentTime, 'HH:mm').isAfter(moment(input, 'HH:mm').subtract(1,'minute'));
  }

  isTimeWithIn(from: string, to: string): boolean {
    const currentTime = moment().format('HH:mm'); // Get system time in HH:mm format
    // console.log(`${moment(currentTime, 'HH:mm')} > ${moment(givenTime, 'HH:mm')}`);
    return moment(currentTime, 'HH:mm').isBetween(moment(from, 'HH:mm').subtract(1,'minute'),moment(to, 'HH:mm').add(1,'minute'));
  }

  // @Cron(CronExpression.EVERY_5_SECONDS) //set the timer to 15 minute
  // handleExchange() {
  //   this.logger.debug('Exchange Checker');
  //   //check the current time against market (exchange) open and close and holidays
  //   //on entering the time window, subscribe feed for securities (exchange specific) in open orders
  //   //on exiting the time window, unsubscribe all feeds (specific)
  //   //with in market active time window
  // }
}