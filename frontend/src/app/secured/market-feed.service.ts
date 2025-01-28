import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class MarketFeedService {

    apiUrl = `${environment.apiHost}/feed`;

    constructor(private http: HttpClient){}

    subscribe(securities:any){
        return this.http.post(`${this.apiUrl}/request`,{control:15,securities});
    }

    async usubscribe(){
        console.log('unsubscribing..',this.apiUrl);
        try {
            await this.http.post(`${this.apiUrl}/request`,{control:12});    
            console.log('called');
            
        } catch (error) {
            console.log(error);
            
        }
        
    }

}