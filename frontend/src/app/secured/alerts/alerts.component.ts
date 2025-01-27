import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import moment from 'moment';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendComponent } from '../trend/trend.component';
import { AlertOrdersComponent } from './alert-orders.component';

@Component({
  imports: [CommonModule,FormsModule,TrendComponent,AlertOrdersComponent],
  templateUrl: './alerts.component.html'
})
export class AlertsComponent {
  
  date:string = moment().format('YYYY-MM-DD');

  constructor(){
  }

    today(){
      this.date = moment().format('YYYY-MM-DD');
    }

}
