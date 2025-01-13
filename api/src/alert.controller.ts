import { Body, Controller, Get, Inject, LoggerService, Param, Post, Res, UseGuards} from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {

  constructor(private service:AlertService) {}

  @Post('/filter')
  async findAllById(@Body() payload:any) {
   return await this.service.findAllById(payload); 
  }

}