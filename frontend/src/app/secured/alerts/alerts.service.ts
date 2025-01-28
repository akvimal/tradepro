import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    apiUrl = `${environment.apiHost}/alerts`;

    constructor(private http: HttpClient){}

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