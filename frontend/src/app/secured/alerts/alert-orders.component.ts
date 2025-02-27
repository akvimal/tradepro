import { Component, EventEmitter, Inject, Input, Output, SimpleChanges } from "@angular/core";
import { OrderService } from "../orders/orders.service";
import { CommonModule, formatDate } from "@angular/common";
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
    @Input() squareAll = false;

    @Output() squared = new EventEmitter();
    
    private subscription: Subscription;
    orders:any = [];

    constructor(private wsService: WebSocketService, 
        private service:OrderService, 
        private alertService:AlertService){
       

          this.subscription = this.service.orders$
          .subscribe(data => {
            // console.log(`>>> orders [${this.date}] from cache`,data);
            
            const found = data.find((st:any) => st.strategy == this.alertid && st['orders']['date'] == this.date);            
            this.orders = found ? found['orders'] : [];
           
          });
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log(changes);
        if(changes['alertid'])
            this.alertid = changes['alertid'].currentValue;
        if(changes['date'])
            this.date = changes['date'].currentValue; 
        if(changes['squareAll'] && changes['squareAll'].currentValue == true)
            this.squareOff('All','');

        this.fetch(this.alertid,this.date);
    }
    
    ngOnInit(){
       this.fetch(this.alertid,this.date);
    }

    async fetch(alertid:string,date:string){
        await this.service.findOrderSummary({strategy:alertid,date});
    }

    toggleTrend(direction:string){
        if(direction == 'BUY'){
            this.buy = !this.buy;
            this.alertService.updateTrendFlag(this.alertid,direction,this.buy).subscribe(data => {
                // console.log(data);
            });
        }
        if(direction == 'SELL'){
            this.sell = !this.sell;
            this.alertService.updateTrendFlag(this.alertid,direction,this.sell).subscribe(data => {
                // console.log(data);
            });
        }
    }

    squareOff(type:string,security:string){
        const request = this.buildSquareOffRequest(type,security);
        // console.log('Square off: ',request);
        
        request.length > 0 && this.service.squareOff(this.alertid,this.buildSquareOffRequest(type,security));
    }

    buildSquareOffRequest(type:string,security:string){
        const req:SquareOffOrder[] = [];
        if(type == 'All' || security !== '') {
            this.addToRequest(this.orders,req,'Bullish',security);
            this.addToRequest(this.orders,req,'Bearish',security);
        }
        else
            this.addToRequest(this.orders,req,type,security);
        return req;
    }

    addToRequest(orders:any,req:SquareOffOrder[],type:string,secId:string){
        const temp = orders[type.toLowerCase()];
        temp.forEach((order:any) => {
            const {exchange,segment,security} = order;
            if((secId !== '' && security == secId) || secId == ''){
                if(!req.find(o => o.security == security))
                    req.push({strategy:this.alertid,type:(type == 'Bullish'?'SELL':'BUY'),exchange,segment,security});
            }
        });
    }

}