import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket;

  constructor() {
    // const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM1Nzg1MjU0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiaHR0cDovLzg5LjIzMy4xMDQuMjo5MDkwL29yZGVyL2ZlZWRiYWNrL2RoYW4iLCJkaGFuQ2xpZW50SWQiOiIxMTAxMTIxNTE1In0.DIoESWnDxtUYzAjCdD8z-DWB7dBWQceOEySLTt2i6rsyHZkpFe8YLbBkW-YiGbPwStPuDWBkkRhg7oT0kKDsvA`;
    //     const clientId = `1101121515`;
        
    //     const url = `wss://api-feed.dhan.co?version=2&token=${token}&clientId=${clientId}&authType=2`
    //     console.log('connecting ws ...');
        const url = 'ws://localhost:3000';
         
    this.socket = io(url); 
  }

  sendMessage(message: string) {
    this.socket.emit('message', { text: message });
  }

  receiveMessages(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('message', (data) => {
        console.log('received message',data);
        
        subscriber.next(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}