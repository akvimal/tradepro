import { Component } from '@angular/core';
import { formatDate} from '@angular/common';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendComponent } from '../trend/trend.component';
import { AlertOrdersComponent } from './alert-orders.component';
import { AlertService } from './alerts.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  imports: [
    CommonModule,FormsModule, RouterModule, 
    TrendComponent,AlertOrdersComponent],
  templateUrl: './alert-dashboard.component.html'
})
export class AlertDashboardComponent {
  
  id:string = '';
  date:string = '';

  alert:any;

  constructor(private route: ActivatedRoute, private service:AlertService){}

  ngOnInit(){
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id')!;
      this.today();
      
      this.service.findById(this.id).subscribe(data => {
        this.alert = data;
      });  
    });
  }

  today(){
    this.date = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  }

}
