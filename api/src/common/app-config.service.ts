import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class AppConfigService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async getPartnerInfo(partner:string){
        return (await this.manager.query(`select * from partners where title = '${partner}'`))[0];
    }

}