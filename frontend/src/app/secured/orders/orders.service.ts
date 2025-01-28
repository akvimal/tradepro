import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Subject } from "rxjs";
import { WebSocketService } from "../../websocket.service";
import { MarketFeedService } from "../market-feed.service";

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    apiUrl = `${environment.apiHost}/orders`;

    private subject = new Subject(); 
    orders$ = this.subject.asObservable();

    constructor(private http: HttpClient, private socketService:WebSocketService, private feedService:MarketFeedService){
        this.socketService.receiveMessages().subscribe((message) => {
            if(message && message.type == 'ORDER'){
                this.updateOrders(message.orders);
                    // console.log('>>>',message.orders);
                    // subscribe to LTP feed for all orders
                    const bothorders = [...message.orders['bullish'],...message.orders['bearish']]
                    const feedSubscribeList = bothorders.map(o => {
                        return {exchange:o['exchange']+'_'+o['segment'],security_id:o['security']}});
                    // console.log(feedSubscribeList);
                    
                    this.feedService.subscribe(feedSubscribeList).subscribe(data=>{
                        console.log('subscribed');
                    });
            }
        }); 
    }

    findOrders(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

    async findAlertOrders(criteria:any){
       this.http.post(`${this.apiUrl}/summary`,criteria).subscribe(data => {
        this.refreshPcnt(data);
        this.subject.next(data);
       });
    }

    refreshPcnt(orders:any){
        orders.bullish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = s['exit'] - +s['price'];
                s['change_pcnt'] = (s['exit'] - +s['price'])/+s['price'];
            }
            s['sl_pcnt'] = (+s['trigger'] - s['price'])/+s['price'];
        });
        orders.bearish.forEach((s:any) => {
            if(s.balance == 0) {
                s['change_valu'] = +s['price'] - s['exit'];
                s['change_pcnt'] = (+s['price'] - s['exit'])/+s['price'];
            }
            s['sl_pcnt'] = (s['price'] - +s['trigger'])/+s['price'];
        });
    }

    updateOrders(data:any) {
        this.refreshPcnt(data);
        this.subject.next(data);
    }

    squareOff(alertid:number,exchange:string,security:string){
        const obj = JSON.parse(`{"${exchange}":[${security}]}`);
        this.http.post(`${this.apiUrl}/sqroff/${alertid}`,obj).subscribe(data => {
            console.log('squared');
        });
    }
    
}