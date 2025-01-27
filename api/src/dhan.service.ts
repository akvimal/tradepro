import { Inject, Injectable } from '@nestjs/common';
import { ApiService } from './api.service';

@Injectable()
export class DhanService {

  token:string = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM4MzA5ODgxLCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMTEyMTUxNSJ9.hYmfdcI7xYcSPFtJ6hh3vd9VGfjRASywIQ34K6R_guDMwsqmY0iKqSHPauYksIByX5m05g3Do2g29OQwN7GJFg'
  client:string = '1101121515'

  constructor(private readonly apiService: ApiService) {}

  async getLtp(securities:[]){
    const response = await this.apiService.postData(`https://api.dhan.co/v2/marketfeed/ltp`,{NSE_EQ:securities},{
        'access-token':this.token,
        'client-id': this.client
      });
      return response;
  }

}
