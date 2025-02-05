import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Alert } from "./alert.entity";

@Index("order_pk", ["id"], { unique: true })
@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id?: number;

  @Column("integer", { name: "alert_id"})
  alertId?: number;
  @Column("character varying", { name: "exchange", length: 255 })
  exchange: string;  
  @Column("character varying", { name: "segment", length: 255 })
  segment: string;
  @Column("character varying", { name: "instrument", length: 255 })
  instrument: string;
  @Column("timestamp", { name: "order_dt"})
  orderDt: string | null;
  @Column("character varying", { name: "security_id", length: 255 })
  securityId: string;
  @Column("character varying", { name: "symbol", length: 255 })
  symbol: string;
  @Column("character varying", { name: "order_type", length: 255 })
  orderType: string;
  @Column("character varying", { name: "entry_type", length: 255 })
  entryType: string;
  @Column("character varying", { name: "delivery_type", length: 255 })
  deliveryType: string;
  @Column("character varying", { name: "leg", length: 255 })
  leg: string;
  @Column("double precision", { name: "order_qty", precision: 53 })
  orderQty: number;
  @Column("character varying", { name: "status" })
  status?: string;
  @Column("character varying", { name: "trend" })
  trend?: string;
  @Column({ name: 'trail', type: 'boolean', default: true })
  trail: boolean;
  @Column("character varying", { name: "comments" })
  comments?: string;

  @Column("double precision", { name: "traded_price", precision: 53 })
  tradedPrice?: number;  
  @Column("double precision", { name: "trigger_price", precision: 53 })
  triggerPrice?: number;

  @ManyToOne(
      () => Alert,
      (as) => as.orders
  )
  @JoinColumn([{ name: "alert_id", referencedColumnName: "id" }])
  alert?: Alert;
}