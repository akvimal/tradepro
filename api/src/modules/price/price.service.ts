import { Injectable } from "@nestjs/common";
import { DhanService } from "src/modules/common/dhan.service";
import { AppConfigService } from "../common/app-config.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PriceService {

    list = [];
    // partner:any;

    constructor (private readonly dhanService: DhanService,
      private readonly appConfigService: AppConfigService,
      // private readonly orderService: OrdersService
    ) {
      // this.partner = this.appConfigService.getPartnerInfo('Dhan');
    }

    async getSecuritiesLtp(exchange,segment,ids){
      const partner = await this.appConfigService.getPartnerInfo('Dhan');
      console.log(partner);
      
      const ltpReq = this.buildExchangeLtpBulkRequest(exchange,segment,ids);      
      return await this.dhanService.getLtp(ltpReq,partner);
    }

    async getLtp(orders){
      const partner = await this.appConfigService.getPartnerInfo('Dhan');
      const ltpReq = this.buildLtpBulkRequest(orders);
      return await this.dhanService.getLtp(ltpReq,partner);
    }

    buildLtpBulkRequest(orders){//TODO: this can be moved to partner impl
        const request = {}; //[{NSE_EQ:[100,200]}]
        if(orders.length > 1){
          orders.forEach(order => {
            const {exchange,segment,security} = order;
            const key = `${exchange}_${segment}`;
            
            const found = Object.keys(request).indexOf(key) >= 0;      
            if(found) 
              request[key].push(+security);
            else {
              request[`${key}`] = [+security];
            }
          });
        }
        else if(orders.length == 1) {
          const order = orders[0];
          const {exchange,segment,security} = order;
          request[`${exchange}_${segment}`] = [+security];
        }
        return request;
    }

    buildExchangeLtpBulkRequest(exchange, segment, ids){//TODO: this can be moved to partner impl
      const request = {}; //[{NSE_EQ:[100,200]}]
      if(ids.length > 1){
        ids.forEach(id => {
          // const {exchange,segment,security} = order;
          const key = `${exchange}_${segment}`;
          
          const found = Object.keys(request).indexOf(key) >= 0;      
          if(found) 
            request[key].push(+id);
          else {
            request[`${key}`] = [+id];
          }
        });
      }
      else if(ids.length == 1) {
        const order = ids[0];
        // const {exchange,segment,security} = order;
        request[`${exchange}_${segment}`] = [+ids[0]];
      }
      console.log('LTP request: ',request);
      
      return request;
  }

    async subscribeTickerFeed(type,exchange,segment,security){
      const found = this.list.find(l => l.exchange == exchange && l.segment == segment && l.security == security);
      if(!found){
        this.list.push({exchange,segment,security});
        await this.dhanService.subscribeFeed(type,[{exchange,segment,security}]);
      }
    }

    unsubscribeFeed(type){

    }

    adjustSL(security,ltp){
      
    }

  //   async handlePriceChange(security,ltp){
  //     await this.orderService.handlePriceChange(security,ltp);
  // }
}