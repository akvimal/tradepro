import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';

@Injectable()
export class RabbitMQService {

  private channelWrapper: ChannelWrapper;

  constructor(private readonly configService:ConfigService) {
    const connection = amqp.connect([this.configService.get('MESSAGE_URL')]);
    this.channelWrapper = connection.createChannel();
  }

  async publishMessage(queueName: string, message: any) {
    try {
      await this.channelWrapper.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    } catch (error) {
      throw new HttpException(
        'Error publishing to queue ' + queueName,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}