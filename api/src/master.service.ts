import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class MasterService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findSecurityInfo(exchange:string,segment:string,symbol:string){
        let sql = `select * from security_master where exch_id = '${exchange}' and segment = '${segment}' and underlying_symbol = '${symbol}'`;
        return await this.manager.query(sql);
    }

}