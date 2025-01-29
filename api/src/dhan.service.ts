import { Injectable } from '@nestjs/common';
import { ApiService } from './api.service';
import { AppConfigService } from './common/app-config.service';

@Injectable()
export class DhanService {

  constructor(private readonly apiService: ApiService, 
    private readonly appConfigService:AppConfigService) {}

  async getLtp(payload){
    // console.log('LTP Request: ',JSON.stringify(payload));
    
    const partner = await this.appConfigService.getPartnerInfo('Dhan');
    const {access_token,client_id,api_url} = partner['config'];
    const response = await this.apiService.postData(`${api_url}/marketfeed/ltp`,payload,{
        'access-token': access_token,
        'client-id': client_id
      });
      const result = [];
      const secs = Object.values(response['data']['data']);

      for (const [key, value] of Object.entries(secs[0])) {
        result.push({security:key,price:value['last_price']})
      }
      return result;
  }

}
