import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { TrendService } from './trend.service';

@Controller('trend')
export class TrendController {

  constructor(private service:TrendService) {}

  @Post('/filter')
  async findAllById(@Body() payload:any) {
   return await this.service.findAllById(payload); 
  }

}