import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { TrendService } from './trend.service';
import { AlertService } from '../strategy/alert.service';

@Controller('trend')
export class TrendController {

  constructor(private readonly trendService:TrendService,
    private readonly alertService:AlertService
  ) {}

  @Post('/filter')
  async findAllById(@Body() payload:any) {
    const {strategy,date,limit} = payload;
    const {interval,frequency} = await this.alertService.findOne(strategy);
   return await this.trendService.findAllById(strategy,date,`${interval} ${frequency.toLowerCase()}`,limit); 
  }

}