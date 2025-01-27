import { Body, Controller, Get, Inject, LoggerService, Param, Post, Put, Res, UseGuards} from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {

  constructor(private service:AlertService) {}

  @Get('/:id')
  async findById(@Param('id') id:number) {
   return (await this.service.findOne(id))[0]; 
  }

  @Get()
  async findAll() {
   return await this.service.findAll(); 
  }

  @Post('/filter')
  async findAllById(@Body() payload:any) {
   return await this.service.findAllById(payload); 
  }
  
  @Put('/trend')
  async updateTrendFlag(@Body() payload:any) {
   return await this.service.updateTrendFlag(payload['alertId'],payload['trend'],payload['on']); 
  }

}