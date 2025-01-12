import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class AlertService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async save( alertid: string, direction: string, triggered:string, symbols:string) {  
      
      const time_format = 'yyyy-mm-dd HH:MI';

      let query = `select * from tradetemp.signals where alert_id = ${alertid} and triggered = to_timestamp('${triggered}', '${time_format}')`
        
        try {
            const existing = await this.manager.query(query);
            // console.log(existing);
            
            if(!existing || existing.length == 0){
                if(direction == 'Bullish')
                query = `insert into tradetemp.signals (alert_id,triggered,bullish) 
                values (${alertid},to_timestamp('${triggered}', '${time_format}'),'${symbols}')`;
                if(direction == 'Bearish')
                    query = `insert into tradetemp.signals (alert_id,triggered,bearish) 
                    values (${alertid},to_timestamp('${triggered}', '${time_format}'),'${symbols}')`;
                const inserted = await this.manager.query(query);
            }
            else{
                
                if(direction == 'Bullish'){
                    // if(existing.rows[0].bullish)
                    query = `update tradetemp.signals set bullish = '${(existing[0].bullish ? existing[0].bullish+',' : '') +symbols}' where alert_id = ${alertid} and triggered = to_timestamp('${triggered}', '${time_format}')`;
                }
                if(direction == 'Bearish'){
                    // if(existing.rows[0].bearish)
                    query = `update tradetemp.signals set bearish = '${(existing[0].bearish ? existing[0].bearish+',':'')+symbols}' where alert_id = ${alertid} and triggered = to_timestamp('${triggered}', '${time_format}')`;
                }
                const updated = await this.manager.query(query);
            }
            // console.log(existing.rows);
        } catch (error) {
            console.log(error);
        }
    }

}