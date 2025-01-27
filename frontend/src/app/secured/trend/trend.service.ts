import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class TrendService {

    apiUrl = `${environment.apiHost}/trend`;

    constructor(private http: HttpClient){}

    findAllById(criteria:any){
        return this.http.post(`${this.apiUrl}/filter`,criteria);
    }

}