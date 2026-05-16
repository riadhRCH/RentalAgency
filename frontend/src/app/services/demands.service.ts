import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Demand {
  _id: string;
  agencyId: string;
  personnelId: any;
  customerName: string;
  customerEmail: string;
  nbBedrooms: string[];
  zones: string[];
  mustHaveFeatures: string[];
  additionalNotes?: string;
  budget: string;
  status: 'NEW' | 'CONTACTED' | 'MATCHED' | 'CLOSED';
  createdAt: Date;
}

export interface PaginatedDemands {
  data: Demand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DemandsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/demands`;

  constructor(private http: HttpClient) {}

  getDemands(page = 1, limit = 20): Observable<PaginatedDemands> {
    return this.http.get<PaginatedDemands>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getDemand(id: string): Observable<Demand> {
    return this.http.get<Demand>(`${this.apiUrl}/${id}`);
  }

  createDemand(data: Partial<Demand>): Observable<Demand> {
    return this.http.post<Demand>(this.apiUrl, data);
  }

  updateDemand(id: string, data: Partial<Demand>): Observable<Demand> {
    return this.http.patch<Demand>(`${this.apiUrl}/${id}`, data);
  }

  deleteDemand(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createPublicDemand(agencyId?: string): Observable<Demand> {
    return this.http.post<Demand>(`${this.apiUrl}/public`, { agencyId });
  }

  getPublicDemand(id: string): Observable<Demand> {
    return this.http.get<Demand>(`${this.apiUrl}/public/${id}`);
  }

  updatePublicDemand(id: string, data: Partial<Demand>): Observable<Demand> {
    return this.http.patch<Demand>(`${this.apiUrl}/public/${id}`, data);
  }
}
