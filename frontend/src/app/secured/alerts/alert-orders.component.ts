import { Component, Input, SimpleChanges } from "@angular/core";
import { OrderService } from "../orders/orders.service";
import { CommonModule } from "@angular/common";
import { WebSocketService } from "../../websocket.service";
import { Subscription } from "rxjs";
import { MarketFeedService } from "../market-feed.service";
import { AlertService } from "./alerts.service";

@Component({
    imports: [CommonModule],
    selector: 'app-alert-orders',
    templateUrl: './alert-orders.component.html',
    styleUrl: './alert-orders.component.css'
})
export class AlertOrdersComponent {

    @Input() alertid:number = 0;
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
            const {type,security,ltp} = message;
            if(message && type == 'PRICE')
            // this.audioElem.nativeElement.play()
            {
            //  console.log('prices received:', message.prices);
            //  console.log(this.orders);
            
            this.orders.bullish.forEach((s:any) => {
                // const priceFound = message.prices.find((p:any) => p.security == s.security);
                if(s.security == security) {
                    s['ltp'] = ltp;
                    s['change_valu'] = s['ltp'] - +s['price'];
                    s['change_pcnt'] = (s['ltp'] - +s['price'])/+s['price'];
                }
             });
             this.orders.bearish.forEach((s:any) => {
                // const priceFound = message.prices.find((p:any) => p.security == s.security);
                if(s.security == security) {
                    s['ltp'] = ltp;
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
        this.fetch(this.alertid,changes['date'].currentValue);
    }
    
    ngOnInit(){
       this.fetch(this.alertid,this.date);
    }

    fetch(alertid:number,date:string){
        this.service.findAlertOrders({alertid,date}).subscribe((data:any) => {
            this.orders = data;
        }); 
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
}