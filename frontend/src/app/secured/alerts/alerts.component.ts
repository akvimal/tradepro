import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from './alerts.service';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './alerts.component.html'
})
export class AlertsComponent {
  
  alerts:any;

  constructor(private service:AlertService){}

  ngOnInit(){
    this.service.findAll().subscribe(data => this.alerts = data);  
  }

}
