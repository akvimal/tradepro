import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import * as moment from 'moment-timezone';
import { AlertGateway } from '../common/alert.gateway';
import { RabbitMQService } from '../common/rabbitmq.service';
import { TrendService } from './trend.service';
import { Constants } from '../common/constants';

@Controller('signal')
export class SignalController {

  constructor(private gateway:AlertGateway, 
    private readonly mqService: RabbitMQService, 
    private trendService:TrendService) {}

  @Post('/:provider/:alertid/:direction')
  async alertListener(@Param('provider') provider: string, 
      @Param('alertid') alertid: string, 
      @Param('direction') direction: string, 
      @Body() payload: any, @Res() res: any) {
    //log the incoming data
    //save incoming alert to db
    try {
        // console.log('Saving trend to db');
        await this.trendService.save(alertid, direction, this.getTimestampWithTime(payload['triggered_at']), payload.stocks);
        
        // console.log('publishing alert to gateway');
        await this.gateway.publishData({type:Constants.FEED_SIGNAL,alertid,payload});
        
        // console.log('publishing alert to mq');
        await this.mqService.publishMessage(Constants.QUEUE_SIGNAL, {...payload,alertid,direction,provider}).catch(error => console.log(error));  
    } catch (error) {
      console.log(error);
    }
    res.status(200).send({status:'received'});
  }
  
  getTimestampWithTime(timestamp, format = 'DD-MM-YYYY h:mm a') {
    if(timestamp.length <= 8){ // only time is provided
      format = (['am','AM','pm','PM'].indexOf(timestamp.substring(timestamp.length-2)) >= 0) 
                ? 'h:mm a' : 'H:mm';
    }
    // const timestamp = moment.tz(inputTime, 'DD-MM-YYYY h:mm a', 'Asia/Kolkata');
    timestamp = moment(timestamp, format);
    console.log(`timestamp: ${timestamp}`);
    return timestamp;
  }

}