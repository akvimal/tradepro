
import { Inject, Injectable, LoggerService, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { AlertProcessor } from './alert.processor';

@Injectable()
export class AlertConsumer implements OnModuleInit{

  private channelWrapper: ChannelWrapper;
  static ALERT_QUEUE = 'alertQueue';

  constructor(private readonly configService:ConfigService, 
    private readonly processor: AlertProcessor) {
      const url = this.configService.get('MESSAGE_URL');
      const connection = amqp.connect([url]);
      console.log(`Connected to message broker at ${url}`);
      this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(AlertConsumer.ALERT_QUEUE);
        await channel.consume(AlertConsumer.ALERT_QUEUE, async (message) => {
          if (message) {
            const content = JSON.parse(message.content.toString());
            console.log(`Received ${content}`);
            this.processor.process(content);
            channel.ack(message);
          }
        });
      });
      console.log('Alert Consumer service started and listening for messages...');
    } catch (err) {
      console.error('Error starting the alert consumer:', err);
    }
  }
  
}