import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AlertGateway } from 'src/alert.gateway';
import * as WebSocket from 'ws';

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {

  private ws: WebSocket;

  constructor(private gateway:AlertGateway){}

  onModuleInit() {
    this.connectToWebSocket();
  }

  onModuleDestroy() {
    this.ws.close();
  }

  private connectToWebSocket() {
    const access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM4MzA5ODgxLCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMTEyMTUxNSJ9.hYmfdcI7xYcSPFtJ6hh3vd9VGfjRASywIQ34K6R_guDMwsqmY0iKqSHPauYksIByX5m05g3Do2g29OQwN7GJFg';
    const client_id = '1101121515';
    const url = `wss://api-feed.dhan.co?version=2`;

    const endpoint = `${url}&token=${access_token}&clientId=${client_id}&authType=2`;
    this.ws = new WebSocket(endpoint);
    console.log('connecting to DHAN market feed socket ...');
    
    this.ws.on('open', () => {
      console.log('Connected to DHAN WebSocket server');
    });

    this.ws.on('message',async (data) => {
        const price = this.parseBinaryData(data, 'LTP');
        await this.gateway.publishData({type:'PRICE', ...price});
    });

    this.ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed. Reconnecting...');
      setTimeout(() => this.connectToWebSocket(), 5000); // Reconnect after 5 seconds
    });
  }

  sendMessage(message: any) {
    console.log('received message for socket',message);
    
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open. Message not sent.');
    }
  }

    private parseBinaryData(data: Buffer, feed: string) {
        if (data.length < 8) {
            console.error('Invalid data: Less than header size');
            return;
        }
        
        // Parse header
        const feedResponseCode = data.readUInt8(0); // 1 byte
        const messageLength = data.readInt16LE(1); // 2 bytes, Big-Endian
        const exchangeSegment = data.readUInt8(3); // 1 byte
        const securityId = data.readInt32LE(4); // 4 bytes, Big-Endian
        // Parse Body
        const lastTradedPrice = data.readFloatLE(8); // 4 bytes (float32)
        const lastTradeTime = data.readInt32LE(12); // 4 bytes (int32)    

        console.log(`${securityId}: ${lastTradedPrice}`);
      if(feed == 'LTP' && lastTradeTime > 0){
        return {security:securityId,ltp:lastTradedPrice}
      }
      return {};
    }

}
