import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { AlertService } from "./alert.service";
import { RabbitMQService } from "../common/rabbitmq.service";
import { AccountService } from "../accounts/account.service";
import { Constants } from "../common/constants";

@Injectable()
export class AlertProcessor {

    constructor (private readonly mqService: RabbitMQService,
        private readonly alertService: AlertService, 
        private readonly accountService: AccountService
    ){}

    async process(content: any) {
        
        const {alertid,direction,provider,stocks,trigger_prices} = content;
        if(provider === 'chartink'){
            const alert = await this.alertService.findOne(alertid);
            // console.log('Alert: ',alert);

            if(alert && alert.active){                
                const account = (await this.accountService.findByAlert(alert.id))[0];
                if(account == undefined || account.balance <= 0){
                    console.log(`insufficient balance for alert ${alert.id}`);
                    return;
                }

                if((direction === 'Bullish' && alert.buy) || (direction == 'Bearish' && alert.sell)) {
                    await this.mqService.publishMessage(Constants.QUEUE_ORDER, 
                        { type:'NEW', payload:{symbols:stocks,prices:trigger_prices,strategy:alert,direction}}).catch(error => console.log(error));  
                }
            }
        } 
    }

}