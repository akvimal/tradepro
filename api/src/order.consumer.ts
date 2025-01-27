
import { Inject, Injectable, LoggerService, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { OrderProcessor } from './order.processor';

@Injectable()
export class OrderConsumer implements OnModuleInit{

  private channelWrapper: ChannelWrapper;
  static ORDER_QUEUE = 'orderQueue';

  constructor(private readonly configService:ConfigService, 
    private readonly processor: OrderProcessor) {
      const url = this.configService.get('MESSAGE_URL');
      const connection = amqp.connect([url]);
      console.log(`Connected to message broker at ${url}`);
      this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(OrderConsumer.ORDER_QUEUE);
        await channel.consume(OrderConsumer.ORDER_QUEUE, async (message) => {
          if (message) {
            const content = JSON.parse(message.content.toString());
            this.processor.process(content);
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