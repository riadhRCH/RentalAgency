import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VirtualNumber {
  sid: string;
  phoneNumber: string;
  label: string;
}

export interface AgencySettings {
  forwardingNumber: string;
  areaCode: string;
}

export interface AgencyStats { 
  totalLeads: number; 
  totalVisits: number;
  totalTransactions: number
}

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private readonly apiUrl = `${environment.apiBaseUrl}/agencies`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AgencyStats> {
    return this.http.get<AgencyStats>(`${this.apiUrl}/stats`);
  }

  getActiveNumbers(): Observable<VirtualNumber[]> {
    return this.http.get<VirtualNumber[]>(`${this.apiUrl}/numbers/active`);
  }

  provisionNumber(areaCode: string, label: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/numbers/provision`, { areaCode, label });
  }

  getSettings(): Observable<AgencySettings> {
    return this.http.get<AgencySettings>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: AgencySettings): Observable<AgencySettings> {
    return this.http.patch<AgencySettings>(`${this.apiUrl}/settings`, settings);
  }

  getStaff(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/staff`);
  }

  addStaff(phone: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/staff`, { phone, role });
  }

  removeStaff(personnelId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/staff/${personnelId}`);
  }
}
