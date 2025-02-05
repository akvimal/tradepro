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
  balance:any;
  
  private subscription: Subscription;

  constructor(private route: ActivatedRoute, private wsService: WebSocketService, 
    private service:AlertService){
    // this.wsService.receiveMessages().subscribe((message) => {
    //   const {type,payload} = message;
    //   if(message && type == 'BALANCE') {
    //       console.log('Balance',payload);
    //   }
    // }); 
    this.subscription = this.service.balance$
          .subscribe(data => {
            // console.log(`>>> orders [${this.date}] from cache`,data);
            // console.log('data: ',data);
            this.balance = data.find(d => d.strategy == this.id);
            if(this.balance){
              // console.log(this.balance);
              if(this.balance.balance.length>0)
                this.balance['capital_now'] = this.balance.balance[0].amount;
                this.balance['capital_change'] = (this.balance.balance[0].amount-this.balance.capital)/this.balance.capital;
                this.balance['change_realized'] = this.balance.realized/this.balance.balance[0].amount;
                this.balance['change_unrealized'] = this.balance.unrealized/this.balance.balance[0].amount;
              }
          });
  }

  

  ngOnInit(){
    this.route.paramMap.subscribe((params) => {
      
      
      this.id = params.get('id')!;
      console.log('ID>',this.id);
      this.today();
      
      this.service.findById(this.id).subscribe(data => {
        this.alert = data;
      });  
    });
    this.service.getBalance({});
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
