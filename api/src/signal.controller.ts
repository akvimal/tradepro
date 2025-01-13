import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { AlertGateway } from './alert.gateway';
import { AlertService } from './alert.service';


@Controller('signal')
export class SignalController {

  constructor(private gateway:AlertGateway, private service:AlertService) {}

  @Post('/:provider/:alertid/:direction')
  async alertListener(@Param('provider') provider: string, 
      @Param('alertid') alertid: string, 
      @Param('direction') direction: string, 
      @Body() payload: any, @Res() res: any) {
    //log the incoming data
    //save incoming alert to db
   try {
    await this.service.save(alertid, direction, this.getTimestampWithTime(payload.triggered_at),
        payload.stocks);

    this.gateway.publishData({alertid,payload})
   } catch (error) {
    console.log(error);
    
   }
    
    
    res.status(200).send({status:'received'});
  }
  
  getTimestampWithTime(inputTime) {
    console.log(inputTime);
    if(inputTime.length > 5) {
      return inputTime;
    }
    const currentDate = new Date();
    
    // Parse time string
    const [time, modifier] = inputTime.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (modifier === 'pm' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
    }
    if (modifier === 'am' && hours === '12') {
        hours = '00';
    }
    
    const formattedTime = `${hours}:${minutes}`;
    
    // Format current date
    const dateString = currentDate.toISOString().split('T')[0];
    
    return `${dateString} ${formattedTime}`;
  }
}