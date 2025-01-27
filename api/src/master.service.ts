import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class MasterService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findSecurityInfo(symbol:string){
        //TODO:below hardcoded exchange and segment should be parameterized
        let sql = `select * from security_master where exch_id = 'NSE' and segment = 'EQ' and underlying_symbol = '${symbol}'`;
        return await this.manager.query(sql);
    }

}