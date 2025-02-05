import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Order } from "./order.entity";

@Index("alert_pk", ["id"], { unique: true })
@Index("alert_un", ["title"], { unique: true })
@Entity("alerts")
export class Alert {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "title", unique: true })
  title: string;
  
  @Column("json", { name: "config", nullable: true })
  config: object | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
  @Column({ name: 'virtual', type: 'boolean', default: true })
  virtual: boolean;
  @Column({ name: 'buy', type: 'boolean', default: true })
  buy: boolean;
  @Column({ name: 'sell', type: 'boolean', default: true })
  sell: boolean;
  
  @Column("character varying", { name: "frequency"})
  frequency: string;

  @Column("integer", { name: "interval"})
  interval: number;

  @Column("integer", { name: "capital"})
  capital: number;

  @Column("timestamp", { name: "created_on"})
  createdOn: string | null;
  @Column("timestamp", { name: "updated_on"})
  updatedOn: string | null;

  @OneToMany(() => Order, (orders) => orders.alert)
  orders: Order[];
}
