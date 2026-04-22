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

export interface PaymentMethod {
  type: 'bank' | 'mobile' | 'poste';
  provider: string;
  rib?: string;
  accountNumber?: string;
  accountHolder: string;
  bankName?: string;
}

export interface AgencyStats { 
  totalLeads: number; 
  totalVisits: number;
  totalTransactions: number
}

export interface AgencyProfile {
  id: string;
  name: string;
  logo?: string;
  settings?: AgencySettings;
  paymentMethods?: PaymentMethod[];
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

  getProfile(): Observable<AgencyProfile> {
    return this.http.get<AgencyProfile>(`${this.apiUrl}/profile`);
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

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`);
  }

  addPaymentMethod(method: PaymentMethod): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/payment-methods`, method);
  }

  updatePaymentMethod(index: number, method: PaymentMethod): Observable<PaymentMethod> {
    return this.http.patch<PaymentMethod>(`${this.apiUrl}/payment-methods/${index}`, method);
  }

  deletePaymentMethod(index: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payment-methods/${index}`);
  }
}
