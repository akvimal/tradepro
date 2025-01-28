import { Component } from '@angular/core';
import { formatDate} from '@angular/common';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendComponent } from '../trend/trend.component';
import { AlertOrdersComponent } from './alert-orders.component';
import { AlertService } from './alerts.service';

@Component({
  imports: [CommonModule,FormsModule,TrendComponent,AlertOrdersComponent],
  templateUrl: './alerts.component.html'
})
export class AlertsComponent {
  
  id = 1;
  alert:any;
  date:string = '';

  constructor(private service:AlertService){}

  ngOnInit(){
    this.today();
  
    this.service.findById(this.id).subscribe(data => {
      this.alert = data;
    });  
  }

  today(){
    this.date = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  }

}
