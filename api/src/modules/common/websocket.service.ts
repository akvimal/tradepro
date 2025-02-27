import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { AlertGateway } from 'src/modules/common/alert.gateway';
import * as WebSocket from 'ws';
import { AppConfigService } from './app-config.service';
import { RabbitMQService } from './rabbitmq.service';
import { Constants } from './constants';

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {

  private ws: WebSocket;

  constructor(
    private readonly gateway: AlertGateway, 
    private readonly mqService: RabbitMQService, 
    private readonly appConfigService: AppConfigService){}

  onModuleInit() {
    //TODO: move opening socket to background task and open or close based on the exchange time window
    this.connectToWebSocket();
  }

  onModuleDestroy() {
    this.ws.close();
  }

  async connectToWebSocket() {
    const partner = await this.appConfigService.getPartnerInfo('Dhan');
    // console.log(partner);
    
    const {access_token,client_id,feed_url} = partner['config'];
    const endpoint = `${feed_url}&token=${access_token}&clientId=${client_id}&authType=2`;

    this.ws = new WebSocket(endpoint);
    console.log('connecting to DHAN market feed socket ...');
    
    this.ws.on('open', () => {
      console.log('Connected to DHAN WebSocket server');
      // this.sendMessage(JSON.stringify({control:11}))
    });

    this.ws.on('message',async (data) => {
        const price = this.parseBinaryData(data, 'LTP');
        console.log('price from server',price);
        
        if(price)
          await this.mqService.publishMessage(Constants.QUEUE_PRICE, price).catch(error => console.log(error));  

        await this.gateway.publishData({type:Constants.FEED_PRICE, ...price});
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
        // const messageLength = data.readInt16LE(1); // 2 bytes, Big-Endian
        // const exchangeSegment = data.readUInt8(3); // 1 byte
        if(feedResponseCode == 50){
          console.log('Feed Error: may be access token not valid');
          return;
        }
        
        const securityId = data.readInt32LE(4); // 4 bytes, Big-Endian
        // Parse Body
        const lastTradedPrice = data.readFloatLE(8); // 4 bytes (float32)
        const lastTradeTime = data.readInt32LE(12); // 4 bytes (int32)    

        // console.log(`${securityId}: ${lastTradedPrice}`);
      if(feed == 'LTP' && lastTradeTime > 0){
        return {security:securityId,ltp:(Math.round(lastTradedPrice*100)/100)}
      }
      
    }

}
