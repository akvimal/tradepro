import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { CommonModule } from '@angular/common';
import { AlertService } from './secured/alerts/alerts.service';
import moment from 'moment';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule,FormsModule],
  templateUrl: './signal.component.html',
  styleUrl: './signal.component.css'
})
export class SignalComponent implements OnInit {
  
  green = ['#e6ffee','#ccffdd','#b3ffcc','#99ffbb','#80ffaa',
    '#66ff99','#4dff88','#33ff77','#1aff66','#00ff55',
    '#00e64d','#00cc44','#00b33c','#009933','#00802b'];
  red = ['#ffe6e6','#ffcccc','#ffb3b3','#ff9999','#ff8080'
    ,'#ff6666','#ff5050','#ff4d4d','#ff3333','#ff1a1a'
    ,'#ff0000','#e60000','#cc0000','#b30000','#990000'
  ];

  message: any = {};
  alerts:any;
  date:string = moment().format('YYYY-MM-DD');
  
  // @ViewChild('myaudio') audioElem:any;
  symbolCountArray: {symbol:string,bullish?:number,bearish?:number}[] = [];

  constructor(private wsService: WebSocketService,
    private alertService: AlertService
  ){
    this.wsService.receiveMessages().subscribe((message) => {
      // this.message = message;
      
      // this.audioElem.nativeElement.play()
      if(message){
        this.fetch(message['alertid']); 
      }
    }); 
  }

  ngOnInit(): void {
    this.fetch('1');
  }

  refresh(){
    this.fetch('1');
  }

  today(){
    this.date = moment().format('YYYY-MM-DD');
    this.refresh();
  }

  fetch(id:string){
    // const date = moment().format('YYYY-MM-DD');
    // const date = '2025-01-15';
    this.alertService.findAllById({criteria:{id,date:this.date}}).subscribe((data:any) => {
      
      this.alerts = data.map((d:any) => {
        d['triggered'] = d['triggered'].endsWith('Z') ? d['triggered'].substring(0,d['triggered'].length-1) : d['triggered'];
        d['bullish'] = d['bullish'].split(',');
        d['bearish'] = d['bearish'].split(',');
        d['diff'] = d['total_bullish'] - d['total_bearish'];
        return d;
      });
    })
  }

  getColor(level:number){
    if(level < 0)
      return level < -14 ? this.red[14] : this.red[-1*level];
    if(level > 0)
     return level > 14 ? this.green[14] : this.green[level];
    return '#fff';
  }

  getAbs(level:number){
    return Math.abs(level);
  }

}
