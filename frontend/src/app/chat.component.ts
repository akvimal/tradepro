import { Component, OnInit } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit {
  
  message: {name?:string} = {};
  
  constructor(private wsService: WebSocketService){}

  ngOnInit(): void {
    this.wsService.receiveMessages().subscribe((message) => {
      this.message = message;
    });
  }
  
}
