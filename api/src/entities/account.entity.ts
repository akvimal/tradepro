import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Alert } from "./alert.entity";
import { Transaction } from "./transaction.entity";

@Index("account_pk", ["id"], { unique: true })
@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id?: number;

  @Column("integer", { name: "alert_id"})
  alertId?: number;
  @Column("character varying", { name: "acct_name" })
  acctName: string;

  @Column("double precision", { name: "balance", precision: 53 })
  balance?: number;  

  @Column("timestamp", { name: "created_on"})
  createdOn: string | null;
  @Column("timestamp", { name: "updated_on"})
  updatedOn: string | null;

  @OneToOne(
      () => Alert,
      (as) => as.orders
  )
  @JoinColumn([{ name: "alert_id", referencedColumnName: "id" }])
  alert?: Alert;

  @OneToMany(() => Transaction, (t) => t.account)
    transactions: Transaction[];
}