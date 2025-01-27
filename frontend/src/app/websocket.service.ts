import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private socket: Socket;
  wsUrl = `${environment.wsHost}`;    

  constructor() {
    this.socket = io(this.wsUrl); 
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