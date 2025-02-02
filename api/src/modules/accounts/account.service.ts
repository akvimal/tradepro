import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

@Injectable()
export class AccountService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findByAlert(alertid){
        const sql = `select * from accounts where alert_id = ${alertid}`;
        return await this.manager.query(sql);
    }

    async withdraw(alertid, category, desc, amount){
        const trans = `insert into transactions (acct_id,category,description,withdraw) values 
                ((select id from accounts where alert_id = ${alertid}), '${category}', '${desc}', ${amount})`;
        await this.manager.query(trans);
        const accts = `update accounts set balance = (balance - ${amount}), updated_on = current_timestamp 
                where id = (select id from accounts where alert_id = ${alertid})`;
        await this.manager.query(accts);
    }

    async deposit(alertid, category, desc, amount){
        const trans = `insert into transactions (acct_id,category,description,deposit) values 
                ((select id from accounts where alert_id = ${alertid}), '${category}', '${desc}', ${amount})`;
        await this.manager.query(trans);
        const accts = `update accounts set balance = (balance + ${amount}), updated_on = current_timestamp 
                where id = (select id from accounts where alert_id = ${alertid})`;
        await this.manager.query(accts);
    }

}