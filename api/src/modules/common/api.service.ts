import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ApiService {

  constructor(private readonly httpService: HttpService) {}

  // Example: GET request
  async fetchData(endpoint: string): Promise<any> {
    try {
      const response: AxiosResponse = await lastValueFrom(this.httpService.get(endpoint));
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  // Example: POST request
  async postData(endpoint: string, payload: any, headers?:any): Promise<any> {
    return await lastValueFrom(
        this.httpService.post(endpoint, payload, {headers})
      );
  }

  // Example: PUT request
  async updateData(endpoint: string, payload: any): Promise<any> {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.put(endpoint, payload)
      );
      return response.data;
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }

  // Example: DELETE request
  async deleteData(endpoint: string): Promise<any> {
    try {
      const response: AxiosResponse = await lastValueFrom(this.httpService.delete(endpoint));
      return response.data;
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }
}
