import { Component, Input, SimpleChanges } from "@angular/core";
import { OrderService } from "../orders/orders.service";
import { CommonModule } from "@angular/common";
import { WebSocketService } from "../../websocket.service";
import { Subscription } from "rxjs";
import { MarketFeedService } from "../market-feed.service";
import { AlertService } from "./alerts.service";
import { OrderSummary } from "../orders/order-summary.model";
import { SquareOffOrder } from "../squareoff-order.model";

@Component({
    imports: [CommonModule],
    selector: 'app-alert-orders',
    templateUrl: './alert-orders.component.html',
    styleUrl: './alert-orders.component.css'
})
export class AlertOrdersComponent {

    @Input() alertid:string = '';
    @Input() date:string = '';
    
    @Input() buy = true;
    @Input() sell = true;
    
    private subscription: Subscription;
    orders:any = [];

    constructor(private wsService: WebSocketService, private service:OrderService, 
        private alertService:AlertService,
        private feedService:MarketFeedService){
        this.wsService.receiveMessages().subscribe((message) => {
            // this.message = message;
            // this.audioElem.nativeElement.play()
            const {type,security,ltp} = message;
            if(message && type == 'PRICE') {
                this.orders.bullish.forEach((s:any) => {
                    if(s.security == security) {
                        s['ltp'] =  s.balance > 0 ? ltp : s['exit'];
                        s['change_valu'] = s['ltp'] - +s['price'];
                        s['change_pcnt'] = (s['ltp'] - +s['price'])/+s['price'];
                    }
                });
                this.orders.bearish.forEach((s:any) => {
                    if(s.security == security) {
                        s['ltp'] = s.balance > 0 ? ltp : s['exit'];
                        s['change_valu'] = +s['price'] - s['ltp'];
                        s['change_pcnt'] = (+s['price'] - s['ltp'])/+s['price'];
                    }
                });
            }
          }); 

          this.subscription = this.service.orders$
          .subscribe(orders => {
            this.orders = orders;
          });
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log(changes);
        if(changes['alertid'])
            this.alertid = changes['alertid'].currentValue;
        if(changes['date'])
            this.date = changes['date'].currentValue;

        this.fetch(this.alertid,this.date);
    }
    
    ngOnInit(){
       this.fetch(this.alertid,this.date);
    }

    async fetch(alertid:string,date:string){
        await this.service.findAlertOrders({alertid,date});
    }

    toggleTrend(direction:string){
        if(direction == 'BUY'){
            this.buy = !this.buy;
            this.alertService.updateTrendFlag(this.alertid,direction,this.buy).subscribe(data => {
                console.log(data);
            });
        }
        if(direction == 'SELL'){
            this.sell = !this.sell;
            this.alertService.updateTrendFlag(this.alertid,direction,this.sell).subscribe(data => {
                console.log(data);
            });
        }
    }

    squareOff(type:string,security:string){
        const request = this.buildSquareOffRequest(type,security);
        request.length > 0 && this.service.squareOff(this.buildSquareOffRequest(type,security));
    }

    buildSquareOffRequest(type:string,security:string){
        const req:SquareOffOrder[] = [];
        if(type == 'All') {
            const recs = Object.values(this.orders);
            const orders = recs.flat(1) as OrderSummary[];
            orders.forEach((order: OrderSummary) => {
                const {exchange,segment,security} = order;
                req.push({strategy:this.alertid,exchange,segment,security});
            });
        }
        else if(type == 'Bullish' || type == 'Bearish'){
            const orders = this.orders[type.toLowerCase()];
            orders.forEach((order:any) => {
                const {exchange,segment,security} = order;
                req.push({strategy:this.alertid,exchange,segment,security});
            });
        }
        else{
            if(security !== '') {
                const recs = Object.values(this.orders);
                const orders = recs.flat(1) as OrderSummary[];
                const rec = orders.find((rec: OrderSummary) => rec.security == security);
                if(rec){
                    const {exchange,segment,security} = rec;
                    req.push({strategy:this.alertid,exchange,segment,security});
                }
            }
        }
        return req;
    }

}