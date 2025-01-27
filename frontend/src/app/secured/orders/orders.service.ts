import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Subject } from "rxjs";
import { WebSocketService } from "../../websocket.service";

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    apiUrl = `${environment.apiHost}/orders`;

    private subject = new Subject(); 
    orders$ = this.subject.asObservable();

    constructor(private http: HttpClient, private socketService:WebSocketService){
        this.socketService.receiveMessages().subscribe((message) => {
            
            if(message){
                if(message.type == 'ORDER'){
                    this.updateOrders(message.orders);
                }
                // if(message.type == 'PRICE'){
                //     // console.log(message.prices);
                //     this.updatePrices(message.prices)
                // }
            }
          }); 
    }

    findOrders(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

    findAlertOrders(criteria:any){
        return this.http.post(`${this.apiUrl}/summary`,criteria);
    }

    updateOrders(data:any) {
        this.subject.next(data);
    }

    // updatePrices(prices:any){
    //     console.log('price feed:',prices);
        
    // }
    
}