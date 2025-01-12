import { Injectable } from '@nestjs/common';
import { AppGateway } from './app.gateway';

@Injectable()
export class AppService {
  
  constructor(private readonly gateway:AppGateway){}

  startPublishing() {
    setInterval(() => {
      const data = {
        name: Math.random()
      };
      this.gateway.publishData(data);
    }, 1000);
  }
}
