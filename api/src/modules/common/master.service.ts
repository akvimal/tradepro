import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import * as moment from 'moment';

@Injectable()
export class MasterService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findSecurityInfo(exchange:string,segment:string,symbol:string){
        let sql = `select * from security_master where exch_id = '${exchange}' and segment = '${segment}' and underlying_symbol = '${symbol}'`;
        return await this.manager.query(sql);
    }

    async getOptionSecurityId(exchange: string, segment:string, 
        symbol: string, expiry:string,
        strikePrice: number, optionType: string, moneyness: number) {
          const itm = moneyness < 0;
        let sql = `
        select security_id, display_name as opt_symbol, strike_price::numeric, lot_size 
        from security_master where underlying_symbol like '${symbol}-${moment(expiry).format('MMMYYYY')}%' 
        and exch_id = '${exchange}'
        and segment = '${segment}'
        and option_type = '${optionType}'
        and (strike_price::numeric - ${strikePrice}) ${optionType=='PE'?(itm?'>':'<'):(itm?'<':'>')} 0
        order by strike_price ${optionType=='CE'?(itm?'desc':''):(itm?'':'desc')} limit 10`
        return (await this.manager.query(sql))[Math.abs(moneyness)-1];
    }
}