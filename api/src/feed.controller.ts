import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {

  constructor(private service:FeedService) {}

  @Get()
  async read() {
    console.log('sending data..');
    
   await this.service.send(`
    {
    "RequestCode" : 15,
    "InstrumentCount" : 2,
    "InstrumentList" : [
        {
            "ExchangeSegment" : "NSE_EQ",
            "SecurityId" : "1333"
        },
        {
            "ExchangeSegment" : "BSE_EQ",
            "SecurityId" : "532540"
        }
    ]
}`)
  }

}