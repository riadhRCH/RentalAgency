import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VirtualNumber {
  sid: string;
  phoneNumber: string;
  label: string;
}

export interface AgencySettings {
  forwardingNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private readonly apiUrl = 'http://localhost:3000/agencies';

  constructor(private http: HttpClient) {}

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
