import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { BehaviorSubject, Subject } from "rxjs";
import { WebSocketService } from "../../websocket.service";
import { MarketFeedService } from "../market-feed.service";
import { SquareOffOrder } from "../squareoff-order.model";
import { OrderSummary } from "./order-summary.model";

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    apiUrl = `${environment.apiHost}/orders`;

    private balanceSubject = new BehaviorSubject<{pnl?:number,days?:any[],positions?:any[],unrealized?:{amount?:number,pcnt?:number}}>({}); 
    private subject = new BehaviorSubject<{strategy: string, orders: any[]}[]>([]); 
    orders$ = this.subject.asObservable();
    balance$ = this.balanceSubject.asObservable();

    constructor(private http: HttpClient, private socketService:WebSocketService, private feedService:MarketFeedService){
        this.socketService.receiveMessages().subscribe((message) => {
            if(message){
                if(message.type == 'ORDER'){
                
                    message['payload'].forEach((strategy:any) => {
                        this.refreshPcnt(strategy['orders']);
                    });
                                    
                    this.subject.next(message['payload']);

                    message['payload'].forEach((str:any) => {
                        const bothorders = [...str.orders['bullish'],...str.orders['bearish']]
                        const feedSubscribeList = bothorders.map(o => {
                            return {exchange:o['exchange']+'_'+o['segment'],security_id:o['security']}});
                        
                        this.feedService.subscribe(feedSubscribeList).subscribe(data=>{
                            console.log('subscribed');
                        });    
                    });
                    
                }
                if(message.type == 'PRICE'){

                    const {type,security,ltp} = message;
                    let ur_value = 0;
                    let ur_total = 0;
                        
                    const strategies = this.subject.getValue();
                    // console.log('orders >>>',strategies.flat(2));
                    console.log(`Security[${security}] LTP[${ltp}]`);
                    strategies.forEach((st:any) => {
                        const orders = st['orders'];
                        orders.bullish && orders.bullish.forEach((s:any) => {
                            if(s.security == security) {
                                s['ltp'] =  s.balance > 0 ? ltp : s['exit'];
                                s['change_valu'] = s['ltp'] - +s['price'];
                                s['change_pcnt'] = (s['ltp'] - +s['price'])/+s['price'];
                            }
                        });
                        orders.bearish && orders.bearish.forEach((s:any) => {
                            if(s.security == security) {
                                s['ltp'] = s.balance > 0 ? ltp : s['exit'];
                                s['change_valu'] = s['order_type'] == 'BUY' ? s['ltp'] - +s['price'] : +s['price'] - s['ltp'];
                                s['change_pcnt'] = s['order_type'] == 'BUY' ? (s['ltp']- +s['price'])/+s['price'] : (+s['price'] - s['ltp'])/+s['price'];
                            }
                        });
                    });
                
//                 const bal = this.balanceSubject.getValue();
//                 // console.log('bal: ',bal);
//                 // this.balance['change_realized'] = this.balance.realized/this.balance.balance[0].amount;
//                   // this.balance['change_unrealized'] = this.balance.unrealized/this.balance.balance[0].amount;
                  
//                   bal.positions?.filter(p => !p.realized).forEach(pos => {
//                     if(pos['security_id']==security){
//                         console.log(pos);
//                         console.log(`ltp: ${ltp}`);
                        
//                         ur_value += ((ltp - pos['price'])*pos['order_qty']);
//                         ur_total += (pos['price']*pos['order_qty']);
//                     }
//                   });
// console.log(`ur_value:${ur_value} ur_total:${ur_total}`);

//                   bal['unrealized']= {amount:Math.round(ur_value),pcnt:ur_value/ur_total};
//                   console.log('unrealized: ',bal['unrealized']);
                  
//                   this.balanceSubject.next({...bal});
            
                }
            }
        }); 
    }
    async getBalance(id:any){
        console.log(`getting the balance for ${id}...`);
        this.http.get(`${this.apiUrl}/balance/${id}`).subscribe((data:any) => {
            
            
            this.balanceSubject.next(data);
        });
    }

    findOrders(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

    async findOrderSummary(criteria:any){
        
       this.http.post(`${this.apiUrl}/summary`,criteria).subscribe((data:any) => {
        // console.log('orders data from api: ',data);
        data.forEach((strategy:any) => {
            this.refreshPcnt(strategy['orders']);
            // console.log('orders percent refreshed');    
        });
        
        // console.log('DATA: ',data);
        
        this.subject.next(data);
       });
       
    }

    refreshPcnt(orders:any){
        orders.bullish && orders.bullish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = s['exit'] - +s['price'];
                s['change_pcnt'] = (s['exit'] - +s['price'])/+s['price'];
            }
            //TODO: thre is a bug with SL calculation, as trigger price is 
            // not available on first instance of order creation, due to asynronously creating SL leg
            
            s['sl_pcnt'] = (+s['trigger'] - s['price'])/+s['price'];
        });
        orders.bearish && orders.bearish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = s['order_type'] == 'BUY' ? s['exit'] - +s['price'] : +s['price'] - s['exit'] ;
                s['change_pcnt'] = s['order_type'] == 'BUY' ? (s['exit'] - +s['price'])/+s['price'] : (+s['price'] - s['exit'])/+s['price'];
            }
            s['sl_pcnt'] = (s['price'] - +s['trigger'])/+s['price'];
        });
    }

    squareOff(strategy:string,request:SquareOffOrder[]){
        console.log(`Square off: ${request}`);
        
        this.http.post(`${this.apiUrl}/sqroff/${strategy}`,request).subscribe(data => {
            console.log('squared');
            
        });
    }
    
}