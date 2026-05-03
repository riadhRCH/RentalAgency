import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VisitVisitorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture?: string;
  preferredContact?: string;
  email?: string;
}

export interface VisitRequest {
  _id: string;
  propertyId: any;
  visitorId: VisitVisitorProfile;
  agencyId: string;
  visitDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  createdAt: Date;
}

export interface PaginatedVisits {
  data: VisitRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class VisitsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/visits`;

  constructor(private http: HttpClient) {}

  getVisits(page = 1, limit = 20, status?: string): Observable<PaginatedVisits> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.http.get<PaginatedVisits>(url);
  }

  getVisit(id: string): Observable<VisitRequest> {
    return this.http.get<VisitRequest>(`${this.apiUrl}/${id}`);
  }

  updateVisit(id: string, data: Partial<VisitRequest>): Observable<VisitRequest> {
    return this.http.patch<VisitRequest>(`${this.apiUrl}/${id}`, data);
  }

  deleteVisit(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
