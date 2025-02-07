import { Component } from '@angular/core';
import { formatDate} from '@angular/common';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendComponent } from '../trend/trend.component';
import { AlertOrdersComponent } from './alert-orders.component';
import { AlertService } from './alerts.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WebSocketService } from '../../websocket.service';
import { Subscription } from 'rxjs';
import { OrderService } from '../orders/orders.service';

@Component({
  imports: [
    CommonModule,FormsModule, RouterModule, 
    TrendComponent,AlertOrdersComponent],
  templateUrl: './alert-dashboard.component.html'
})
export class AlertDashboardComponent {
  
  id:string = '';
  date:string = '';
  squareAll = false;
  alert:any;
  balance:any = {};
  
  private subscription: Subscription;

  constructor(private route: ActivatedRoute, 
    private wsService: WebSocketService, 
    private orderService:OrderService, 
    private service:AlertService){
    // this.wsService.receiveMessages().subscribe((message) => {
    //   const {type,payload} = message;
    //   if(message && type == 'BALANCE') {
    //       console.log('Balance',payload);
    //   }
    // }); 
    this.subscription = this.orderService.balance$
          .subscribe(data => {
            console.log('balance subject data: ',data);
            
            // console.log(`>>> orders [${this.date}] from cache`,data);
            // console.log('data: ',data);
            if(data && this.alert) {
              // console.log('data from subject',data);
              this.balance['capital_now'] = this.alert['capital'] + data['pnl'];
              // this.balance = data.find(d => d.strategy == this.id);
              // if(this.balance){
                // console.log(this.balance);
                
                // if(data['pnl']){
                  this.balance['capital_change'] = (data['pnl'] ? data['pnl'] : 0)/this.alert['capital'];
                  let realized = 0, value = 0;
                  data['positions']?.filter(p => p['realized'] == true).forEach(o => {
                    realized += o['pnl'];
                    value += ((o['traded_price']*o['order_qty'])-o['pnl'])
                  });
                // }
                
                
                this.balance['realized_amt'] = Math.round(realized);
                this.balance['realized_pcnt'] = realized/value;
                // this.balance['change_realized'] = this.balance.realized/this.balance.balance[0].amount;
                  // this.balance['change_unrealized'] = this.balance.unrealized/this.balance.balance[0].amount;
                this.balance['unrealized'] = data['unrealized'];
              // }
            }
          });
  }

  

  ngOnInit(){
    this.route.paramMap.subscribe(async (params) => {
      this.id = params.get('id')!;
      this.today();
      
      this.service.findById(this.id).subscribe(data => {
        this.alert = data;
      });  

      await this.orderService.getBalance(this.id);
    });
    
  }

  today(){
    this.date = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  }

  squareOffAll(){
    this.squareAll = true;
  }

  resetSquareAll(data:boolean){
    this.squareAll = data;
  }
}
