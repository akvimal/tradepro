import { Injectable } from '@nestjs/common';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';

@Injectable()
export class DhanService {

  constructor(
    private apiService: ApiService, 
    private wsService:WebSocketService) {}

  async getLtp(payload,partner){
    console.log('LTP Request: ',JSON.stringify(payload));
    const {access_token,client_id,api_url} = partner['config'];
    const response = await this.apiService.postData(`${api_url}/marketfeed/ltp`, payload,{
        'access-token': access_token,
        'client-id': client_id
      });
      const result = [];
      const secs = Object.values(response['data']['data']);
      
      if(secs.length > 0)
      for (const [key, value] of Object.entries(secs[0])) {
        const price = Math.round(value['last_price']*100)/100;
        result.push({security:key,price})
      }
      return result;
  }

  //types : ticker,quote,full,20level
  async subscribeFeed(type,securities){
    const list = []
    if(securities && securities.length > 0){
      securities.forEach(sec => {
        list.push({ExchangeSegment:`${sec.exchange}_${sec.segment}`,SecurityId:sec.security})  
      });
    }
    await this.wsService.sendMessage({RequestCode : 15, InstrumentList: list});
  }

  
  unsubscribeFeed(type,securities){
    const list = []
    if(securities && securities.length > 0){
      securities.forEach(sec => {
        list.push({ExchangeSegment:`${sec.exchange}_${sec.segment}`,SecurityId:sec.security})  
      });
    }
    this.wsService.sendMessage({RequestCode : 15, InstrumentList: list});
  }

}
