import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Personnel {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  // Add other fields as needed
}

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private readonly apiUrl = 'http://localhost:3000/personnel';

  constructor(private http: HttpClient) {}

  getPersonnel(page = 1, limit = 100): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getOnePersonnel(id: string): Observable<Personnel> {
    return this.http.get<Personnel>(`${this.apiUrl}/${id}`);
  }

  createPersonnel(data: any): Observable<Personnel> {
    return this.http.post<Personnel>(this.apiUrl, data);
  }

  updatePersonnel(id: string, data: any): Observable<Personnel> {
    return this.http.patch<Personnel>(`${this.apiUrl}/${id}`, data);
  }

  deletePersonnel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
