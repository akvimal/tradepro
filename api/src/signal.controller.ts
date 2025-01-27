import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { AlertGateway } from './alert.gateway';
import { AlertService } from './alert.service';
import * as moment from 'moment-timezone';
import { RabbitMQService } from './common/rabbitmq.service';
import { AlertConsumer } from './alert.consumer';
import { TrendService } from './trend.service';

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
    console.log(payload);
    try {
        console.log('Saving alert to db');
        await this.trendService.save(alertid, direction, this.getTimestampWithTime(payload['triggered_at']), payload.stocks);
        console.log('publishing alert to gateway');
        await this.gateway.publishData({type:'SIGNAL',alertid,payload});
        console.log('publishing alert to mq');
        await this.mqService.publishMessage(AlertConsumer.ALERT_QUEUE, {...payload,alertid,direction,provider}).catch(error => console.log(error));  
        console.log('published alert to mq');
        
    } catch (error) {
      console.log(error);
    }
    res.status(200).send({status:'received'});
  }
  
  getTimestampWithTime(timestamp, format = 'DD-MM-YYYY h:mm a') {

    if(timestamp.length <= 8){ // only time is provided
      format = (['am','AM','pm','PM'].indexOf(timestamp.substring(timestamp.length-2)) >= 0) 
                ? 'DD-MM-YYYY h:mm a' : 'DD-MM-YYYY H:mm';
      timestamp = moment().format('DD-MM-YYYY') + ' ' + timestamp;
    }
   
    // const timestamp = moment.tz(inputTime, 'DD-MM-YYYY h:mm a', 'Asia/Kolkata');
    timestamp = moment(timestamp, format);

    // Convert to PostgreSQL timestamp format
    return timestamp.format('YYYY-MM-DD HH:mm:ss');
  }

}