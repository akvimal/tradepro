import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import * as moment from 'moment';

@Injectable()
export class AlertService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findAllById(payload){
        
        let date = payload.criteria.date ? ` and to_char(triggered, 'YYYY-MM-DD') = '${payload.criteria.date}'` : '';
        let query = `
            	WITH 
                data_set as (
                    select * from signals where alert_id = ${payload.criteria.id} ${date}
                ),
                time_series AS (
                    SELECT generate_series(
                        (SELECT MIN(triggered) FROM data_set),
                        (SELECT MAX(triggered) FROM data_set),
                        INTERVAL '1 minute'
                    ) AS minut
                )
                select fts.minut as triggered,
                coalesce(bullish,'') as bullish, coalesce(array_length(string_to_array(bullish, ','), 1),0) AS total_bullish,
                coalesce(bearish,'') as bearish, coalesce(array_length(string_to_array(bearish, ','), 1),0) AS total_bearish
                from time_series fts left join signals s on fts.minut = date_trunc('minute',s.triggered) and s.alert_id = ${payload.criteria.id}
                order by fts.minut DESC`;

        query += payload.limit ? ` limit ${payload.limit}` : '';

        let alerts = [];
        try {
            alerts = await this.manager.query(query);
        } catch (error) {
            console.log(error);
        }
        return alerts;
    }

    async save( alertid: string, direction: string, triggered:string, symbols:string) {  
      
        const time_format = 'yyyy-mm-dd HH:MI am';
        const time = moment().format('YYYY-MM-DD') + ' ' +triggered;
        
        // const time_format = 'dd-mm-yyyy HH:MI am';

      let query = `select * from signals where alert_id = ${alertid} and triggered = to_timestamp('${time}', '${time_format}')`
        
        try {
            const existing = await this.manager.query(query);
            // console.log(existing);
            
            if(!existing || existing.length == 0){
                if(direction == 'Bullish')
                query = `insert into signals (alert_id,triggered,bullish) 
                values (${alertid},to_timestamp('${time}', '${time_format}'),'${symbols}')`;
                if(direction == 'Bearish')
                    query = `insert into signals (alert_id,triggered,bearish) 
                    values (${alertid},to_timestamp('${time}', '${time_format}'),'${symbols}')`;
                console.log(query);
                
                const inserted = await this.manager.query(query);
            }
            else {
                if(direction == 'Bullish'){
                    // if(existing.rows[0].bullish)
                    query = `update signals set bullish = '${(existing[0].bullish ? existing[0].bullish+',' : '') +symbols}' where alert_id = ${alertid} and triggered = to_timestamp('${time}', '${time_format}')`;
                }
                if(direction == 'Bearish'){
                    // if(existing.rows[0].bearish)
                    query = `update signals set bearish = '${(existing[0].bearish ? existing[0].bearish+',':'')+symbols}' where alert_id = ${alertid} and triggered = to_timestamp('${time}', '${time_format}')`;
                }
                console.log(query);
                const updated = await this.manager.query(query);
            }
            // console.log(existing.rows);
        } catch (error) {
            console.log(error);
        }
    }

}