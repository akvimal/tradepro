import { Component } from "@angular/core";
import { OrderService } from "./orders.service";
import { CommonModule } from "@angular/common";

@Component({
    imports: [CommonModule],
    templateUrl: './orders.component.html'
})
export class OrdersComponent {

    orders:any = []

    constructor(private service:OrderService){}

    ngOnInit(){
        this.service.findOrders(null).subscribe((data:any) => {
            this.orders = data;
        }); 
    }
}