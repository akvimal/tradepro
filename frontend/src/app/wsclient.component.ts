import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule,FormsModule],
  templateUrl: './wsclient.component.html'
})
export class WSClientComponent {
  
  message: any = {};
  request:string = '';
  response:any;
  
  private socket: Socket;
  
  constructor(){
    const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM1Nzg1MjU0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiaHR0cDovLzg5LjIzMy4xMDQuMjo5MDkwL29yZGVyL2ZlZWRiYWNrL2RoYW4iLCJkaGFuQ2xpZW50SWQiOiIxMTAxMTIxNTE1In0.DIoESWnDxtUYzAjCdD8z-DWB7dBWQceOEySLTt2i6rsyHZkpFe8YLbBkW-YiGbPwStPuDWBkkRhg7oT0kKDsvA`;
    const clientId = `1101121515`;
    console.log('connecting ws ...');
    this.socket = io(`wss://api-feed.dhan.co?version=2&token=${token}&clientId=${clientId}&authType=2`);
    this.socket.on('message', (data) => {
      console.log('received',data);
      this.response = data;
      // subscriber.next(data);
    });
  }

  onSubmit(){
    console.log(this.request);
    this.socket.emit('message', this.request);
  }
  
}
