import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {

  constructor(private service:FeedService) {}

  @Post('/request')
  async feedRequest(@Body() payload:any){
    // console.log('request received',payload);

    const req = {RequestCode : payload['control']};
    if(payload['securities']){
      req['InstrumentCount'] = payload['securities'].length;
      req['InstrumentList'] = payload['securities'].map(sec => {return {ExchangeSegment:sec['exchange'],SecurityId:sec['security_id']}})
    }
    await this.service.send(req);
    return {status: 'Success'}
  }

}