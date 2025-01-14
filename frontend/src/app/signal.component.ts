import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { CommonModule } from '@angular/common';
import { AlertService } from './secured/alerts/alerts.service';

@Component({
  imports: [CommonModule],
  templateUrl: './signal.component.html',
  styleUrl: './signal.component.css'
})
export class SignalComponent implements OnInit {
  
  message: any = {};
  alerts:any;
  // @ViewChild('myaudio') audioElem:any;
  
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

  fetch(id:string){
    this.alertService.findAllById({limit:10,criteria:{id}}).subscribe((data:any) => {
      console.log(data);
      this.alerts = data.map((d:any) => {
        d['bullish'] = d['bullish'].split(',');
        d['bearish'] = d['bearish'].split(',');
        return d;
      });
    })
  }
  
}
