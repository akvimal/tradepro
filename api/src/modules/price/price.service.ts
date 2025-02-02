import { Injectable } from "@nestjs/common";
import { DhanService } from "src/modules/common/dhan.service";
import { AppConfigService } from "../common/app-config.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PriceService {

    list = [];

    constructor (private readonly dhanService: DhanService,
      private readonly appConfigService: AppConfigService,
      // private readonly orderService: OrdersService
    ) {}

    async getLtp(orders){
      const partner = await this.appConfigService.getPartnerInfo('Dhan');
      return await this.dhanService.getLtp(this.buildLtpBulkRequest(orders),partner);
    }

    buildLtpBulkRequest(orders){//TODO: this can be moved to partner impl
        const request = {}; //[{NSE_EQ:[100,200]}]
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
        return request;
    }

    async subscribeTickerFeed(type,exchange,segment,security){
      const found = this.list.find(l => l.exchange == exchange && l.segment == segment && l.security == security);
      console.log('found in list',found);
      
      if(!found){
        this.list.push({exchange,segment,security});
        console.log('calling sdhan service..');
        
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