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

    private subject = new BehaviorSubject<{strategy: string, orders: any[]}[]>([]); 
    orders$ = this.subject.asObservable();

    constructor(private http: HttpClient, private socketService:WebSocketService, private feedService:MarketFeedService){
        this.socketService.receiveMessages().subscribe((message) => {
            if(message && message.type == 'ORDER'){
                console.log('>>>',message['payload']);
                
                // const {strategy,orders} = message['payload'];

                message['payload'].forEach((strategy:any) => {
                    this.refreshPcnt(strategy['orders']);
                    console.log('orders percent refreshed');    
                });
                
                // console.log('DATA: ',data);
                
                this.subject.next(message['payload']);

                // this.updateOrders(strategy,orders);

                    console.log('>>>',message.orders);
                    // subscribe to LTP feed for all orders
                
                    message['payload'].forEach((str:any) => {
                        const bothorders = [...str.orders['bullish'],...str.orders['bearish']]
                        const feedSubscribeList = bothorders.map(o => {
                            return {exchange:o['exchange']+'_'+o['segment'],security_id:o['security']}});
                        // console.log(feedSubscribeList);
                        
                        this.feedService.subscribe(feedSubscribeList).subscribe(data=>{
                            console.log('subscribed');
                        });    
                    });
                    
            }
        }); 
    }

    findOrders(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

    async findOrderSummary(criteria:any){
        
       this.http.post(`${this.apiUrl}/summary`,criteria).subscribe((data:any) => {
        console.log('orders data from api: ',data);
        data.forEach((strategy:any) => {
            this.refreshPcnt(strategy['orders']);
            console.log('orders percent refreshed');    
        });
        
        console.log('DATA: ',data);
        
        this.subject.next(data);
       });
       
    }

    refreshPcnt(orders:any){
        console.log('REFRESH PCNT: ',orders);
        
            orders.bullish && orders.bullish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = s['exit'] - +s['price'];
                s['change_pcnt'] = (s['exit'] - +s['price'])/+s['price'];
            }
            s['sl_pcnt'] = (+s['trigger'] - s['price'])/+s['price'];
        });
        // if(orders.bearish && orders.bearish.length > 0)
            orders.bearish && orders.bearish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = +s['price'] - s['exit'];
                s['change_pcnt'] = (+s['price'] - s['exit'])/+s['price'];
            }
            s['sl_pcnt'] = (s['price'] - +s['trigger'])/+s['price'];
        });
    }

    // updateOrders(strategy:string,orders:any) {
    //     console.log('***',orders);
        
    //     this.refreshPcnt(orders);
    //     // this.orders$.subscribe((ordersMap) => {
    //     //     const s = ordersMap.find(s => s.strategy == strategy)
    //     //     if(s){
    //     //         s['orders'] = orders;
    //     //     }
    //     //     else {
    //     //         ordersMap.push({strategy,orders});
    //     //     }
    //     //     this.subject.next(ordersMap);
    //     //   })

    //     this.subject.next(data);
    // }

    squareOff(request:SquareOffOrder[]){
        // const obj = JSON.parse(`{"${exchange}":[${security}]}`);
        this.http.post(`${this.apiUrl}/sqroff`,request).subscribe(data => {
            console.log('squared');
        });
    }
    
}