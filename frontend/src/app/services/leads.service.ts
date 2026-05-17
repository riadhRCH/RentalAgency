import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeadCustomerProfile {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture?: string;
  preferredContact?: string;
  email?: string;
}

export interface Lead {
  _id: string;
  agencyId: string;
  personnelId?: string;
  customerPhone: string;
  customerName?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST';
  pipelineStage: 'PROSPECT' | 'VISITE_A_PLANIFIER';
  budget?: string;
  purchaseType?: 'CASH' | 'LOAN';
  interestedProperties?: string[];
  mustHaveFeatures?: string[];
  nbBedrooms?: string[];
  availability?: string;
  additionalNotes?: string;
  tags: string[];
  notes?: string;
  activities: any[];
  firstSeen: Date;
  lastInteraction: Date;
  createdAt: Date;
  customerProfile?: LeadCustomerProfile;
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PipelineStats {
  total: number;
  stages: {
    PROSPECT: number;
    VISITE_A_PLANIFIER: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/leads`;

  constructor(private http: HttpClient) {}

  getLeads(page = 1, limit = 20, status?: string, pipelineStage?: string): Observable<PaginatedLeads> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (pipelineStage) url += `&pipelineStage=${pipelineStage}`;
    return this.http.get<PaginatedLeads>(url);
  }

  getLead(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.apiUrl}/${id}`);
  }

  getPipelineStats(): Observable<PipelineStats> {
    return this.http.get<PipelineStats>(`${this.apiUrl}/pipeline/stats`);
  }

  updatePipelineStage(id: string, pipelineStage: string): Observable<Lead> {
    return this.http.patch<Lead>(`${this.apiUrl}/${id}/pipeline-stage`, { pipelineStage });
  }

  createLead(data: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(this.apiUrl, data);
  }

  createPublicLead(data: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(`${this.apiUrl}/public`, data);
  }

  updateLead(id: string, data: Partial<Lead>): Observable<Lead> {
    return this.http.patch<Lead>(`${this.apiUrl}/${id}`, data);
  }

  deleteLead(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
