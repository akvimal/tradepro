import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../websocket.service';
import { TrendService } from './trend.service';

@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-alert-trend',
  templateUrl: './trend.component.html',
  styleUrl: './trend.component.css'
})
export class TrendComponent {
  
  green = ['#e6ffee','#ccffdd','#b3ffcc','#99ffbb','#80ffaa',
    '#66ff99','#4dff88','#33ff77','#1aff66','#00ff55',
    '#00e64d','#00cc44','#00b33c','#009933','#00802b'];
  red = ['#ffe6e6','#ffcccc','#ffb3b3','#ff9999','#ff8080'
    ,'#ff6666','#ff5050','#ff4d4d','#ff3333','#ff1a1a'
    ,'#ff0000','#e60000','#cc0000','#b30000','#990000'
  ];

  bullish:string[] = [];
  bearish:string[] = [];

  @Input() alertid:string = '';
  @Input() date:string = '';
  
  message: any = {};
  alerts:any;
  
  symbolCountArray: {symbol:string,bullish?:number,bearish?:number}[] = [];

  constructor(private wsService: WebSocketService,
    private service: TrendService
  ){
    this.wsService.receiveMessages().subscribe((message) => {
      if(message && message.type == 'SIGNAL')
      {
        this.fetch(message['alertid'], this.date); 
      }
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

  fetch(id:string,date:string){
    this.service.findAllById({strategy:id,date:this.date}).subscribe((data:any) => {
      this.bullish = [];
      this.bearish = [];
      this.alerts = data.map((d:any) => {
        
        d['bullish'] = d['bullish'].split(',');
        d['bearish'] = d['bearish'].split(',');
        d['diff'] = d['total_bullish'] - d['total_bearish'];
        
        return d;
      });

      for (let index = this.alerts.length-1; index >= 0; index--) {
        const alert = this.alerts[index];
        alert['bullish'] = alert['bullish'].map((s:string) => {
          const level = this.bullish.indexOf(s) == -1 ? 0 : 1;
          if(level == 0)
            this.bullish.push(s);
          
          return {symbol:s,level};
        });
        alert['bearish'] = alert['bearish'].map((s:string) => {
          const level = this.bearish.indexOf(s) == -1 ? 0 : 1;
          if(level == 0)
            this.bearish.push(s);
          
          return {symbol:s,level};
        });
      }
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
