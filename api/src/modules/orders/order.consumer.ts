
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { OrderProcessor } from './order.processor';
import { Constants } from '../common/constants';

@Injectable()
export class OrderConsumer implements OnModuleInit{

  private channelWrapper: ChannelWrapper;
  static ORDER_QUEUE = 'orderQueue';

  constructor(
    private readonly configService:ConfigService, 
    private readonly processor: OrderProcessor
  ) {
      const url = this.configService.get('MESSAGE_URL');
      const connection = amqp.connect([url]);
      console.log(`Connected to message broker at ${url}`);
      this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(Constants.QUEUE_ORDER);
        
        await channel.consume(Constants.QUEUE_ORDER, async (message) => {
          if (message) {
            const content = JSON.parse(message.content.toString());
            this.processor.process(content);
            channel.ack(message);
          }
        });
        
      });

      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        
        await channel.assertQueue(Constants.QUEUE_PRICE);
        
        await channel.consume(Constants.QUEUE_PRICE, async (message) => {
          
          if (message) {
            const content = JSON.parse(message.content.toString());
            this.processor.handlePriceFeed(content);
            
            channel.ack(message);
          }
        });
      });
      console.log('Order Consumer service started and listening for messages...');
    } catch (err) {
      console.error('Error starting the order consumer:', err);
    }
  }
  
}