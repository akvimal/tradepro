import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account.entity";

@Index("transactions_pk", ["id"], { unique: true })
@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id?: number;

  @Column("integer", { name: "acct_id"})
  accountId?: number;

  @Column("timestamp", { name: "trans_dt"})
  transDt: string | null;

  @Column("character varying", { name: "description", length: 255 })
  description: string;  
  
  @Column("double precision", { name: "deposit", precision: 53 })
  deposit: number;
  @Column("double precision", { name: "withdraw", precision: 53 })
  withdraw: number;
  @Column("character varying", { name: "category" })
  category?: string;

  @ManyToOne(
      () => Account,
      (as) => as.transactions
  )
  @JoinColumn([{ name: "acct_id", referencedColumnName: "id" }])
  account?: Account;
}