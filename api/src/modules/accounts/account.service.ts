import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import * as moment from 'moment-timezone';
import { Account } from "src/entities/account.entity";
import { Alert } from "src/entities/alert.entity";
import { Transaction } from "src/entities/transaction.entity";
import { EntityManager } from "typeorm";

@Injectable()
export class AccountService {

    constructor (@InjectEntityManager() private manager: EntityManager) {}

    async findByAlert(alertid){
        const sql = `select * from accounts where alert_id = ${alertid}`;
        return await this.manager.query(sql);
    }

    async withdraw(alertid, category, desc, amount){
        await this.manager.transaction(async (manager) => {
            const account = await manager.findOne(Account,{where :{alertId:alertid}});
            await manager.save(Transaction, {accountId:account['id'],description:desc,category,withdraw:amount});
            account['balance'] = account['balance'] - amount;
            // console.log(moment().format('YYYY-MM-DD HH:mm:ssZ'));
            account['updatedOn'] = moment().format('YYYY-MM-DD HH:mm:ssZ');
            await manager.save(Account, account);         
        });
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