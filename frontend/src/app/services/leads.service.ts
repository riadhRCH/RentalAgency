import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lead {
  _id: string;
  agencyId: string;
  personnelId?: string;
  customerPhone: string;
  customerName?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST';
  tags: string[];
  notes?: string;
  activities: any[];
  firstSeen: Date;
  lastInteraction: Date;
  createdAt: Date;
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/leads`;

  constructor(private http: HttpClient) {}

  getLeads(page = 1, limit = 20, status?: string): Observable<PaginatedLeads> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.http.get<PaginatedLeads>(url);
  }

  getLead(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.apiUrl}/${id}`);
  }

  createLead(data: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(this.apiUrl, data);
  }

  updateLead(id: string, data: Partial<Lead>): Observable<Lead> {
    return this.http.patch<Lead>(`${this.apiUrl}/${id}`, data);
  }

  deleteLead(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
