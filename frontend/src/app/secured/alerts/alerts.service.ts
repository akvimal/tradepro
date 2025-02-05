import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { BehaviorSubject } from "rxjs";
import { WebSocketService } from "../../websocket.service";

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    private subject = new BehaviorSubject<{strategy: string, balance:any}[]>([]); 
    balance$ = this.subject.asObservable();
    
    apiUrl = `${environment.apiHost}/alerts`;

    constructor(private http: HttpClient, private socketService:WebSocketService){
        this.socketService.receiveMessages().subscribe((message) => {
            if(message && message.type == 'PRICE'){

                console.log(message['payload']);
                
                                
                this.subject.next(message['payload']);
            }
        });
    }

    async getBalance(criteria:any){
        
        this.http.post(`${this.apiUrl}/balance`,criteria).subscribe((data:any) => {
            console.log(data);
            
            this.subject.next(data);
        });
    }

    findById(id:string){
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    findAll(){
        return this.http.get(`${this.apiUrl}`);
    }

    findAllById(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

    updateTrendFlag(alertId:string,trend:string,on:boolean){
        return this.http.put(`${this.apiUrl}/trend`,{alertId,trend,on});
    }
}