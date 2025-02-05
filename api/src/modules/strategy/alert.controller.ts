import { Body, Controller, Get, Inject, LoggerService, Param, Post, Put, Res, UseGuards} from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {

  constructor(private service:AlertService) {}

  @Get('/:id')
  async findById(@Param('id') id:number) {
   return await this.service.findOne(id); 
  }

  @Get()
  async findAll() {
   return await this.service.findAll(); 
  }

  @Post('/filter')
  async findAllById(@Body() payload:any) {
   return await this.service.findAllById(payload); 
  }
  
  @Post('/balance')
  async getBalance(@Body() payload:any) {
  //  return await this.service.findAllById(payload); 
    const sample = {
      strategy: 1,
      capital: 1000000,
      balance: [{date: '2025-02-04',amount:1150000}],
      realized: 10000, unrealized: 2500
    }
    return [sample];
  }
  
  @Put('/trend')
  async updateTrendFlag(@Body() payload:any) {
   return await this.service.updateTrendFlag(payload['alertId'],payload['trend'],payload['on']); 
  }

}