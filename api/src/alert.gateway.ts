import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({ cors: { origin: '*' } })
  export class AlertGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;
  
    afterInit(server: Server) {
      console.log('WebSocket initialized!');
    }
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    // @SubscribeMessage('message')
    // handleMessage(@MessageBody() data: { text: string }, client: Socket): void {
    //   console.log(`Message received: ${data.text}`);
    //   this.server.emit('message', { text: data.text }); // Broadcast to all clients
    // }

    // Method to send data to all clients
    publishData(data: any) {
      this.server.emit('message', data);
    }
  }