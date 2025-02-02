import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { Constants } from "../common/constants";
import { PriceProcessor } from "./price.processor";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PriceConsumer implements OnModuleInit {
    
    private channelWrapper: ChannelWrapper;

    constructor(private readonly configService:ConfigService,
      // private readonly processor:PriceProcessor,
      // private readonly orderService:OrdersService
    ) {
          const url = this.configService.get('MESSAGE_URL');
          const connection = amqp.connect([url]);
          console.log(`Connected to message broker at ${url} for price feed.`);
          this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
          await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
            await channel.assertQueue(Constants.QUEUE_PRICE);
            await channel.consume(Constants.QUEUE_PRICE, async (message) => {
                
              if (message) {
                const content = JSON.parse(message.content.toString());
                // console.log(`Received PRICE message security[${content['security']}], LTP: ${content['ltp']}`);
                // this.processor.process(content);
                // this.orderService.handlePriceChange(content['security'], content['ltp'])
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