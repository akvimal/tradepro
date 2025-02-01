import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { PriceProcessor } from "./price.processor";

@Injectable()
export class PriceConsumer implements OnModuleInit {
    
    private channelWrapper: ChannelWrapper;
    static PRICE_QUEUE = 'priceQueue';

    constructor(private readonly configService:ConfigService,private readonly processor:PriceProcessor) {
          const url = this.configService.get('MESSAGE_URL');
          const connection = amqp.connect([url]);
          console.log(`Connected to message broker at ${url} for price`);
          this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
          await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
            await channel.assertQueue(PriceConsumer.PRICE_QUEUE);
            await channel.consume(PriceConsumer.PRICE_QUEUE, async (message) => {
                
              if (message) {
                const content = JSON.parse(message.content.toString());
                // console.log(`Received PRICE message security[${content['security']}], LTP: ${content['ltp']}`);
                this.processor.process(content);
                channel.ack(message);
              }
            });
          });
          console.log('Price Consumer service started and listening for messages...');
        } catch (err) {
          console.error('Error starting the price consumer:', err);
        }
      }
}