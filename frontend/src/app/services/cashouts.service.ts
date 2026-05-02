import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum CashoutStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export interface Cashout {
  _id: string;
  agencyId: string;
  ownerId: any;
  amount: number;
  status: CashoutStatus;
  notes?: string;
  confirmedAt?: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CashoutsService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/cashouts';

  create(data: { amount: number; notes?: string; agencyId: string }): Observable<Cashout> {
    return this.http.post<Cashout>(this.apiUrl, data);
  }

  getOwnerCashouts(): Observable<Cashout[]> {
    return this.http.get<Cashout[]>(`${this.apiUrl}/owner`);
  }

  getAgencyCashouts(): Observable<Cashout[]> {
    return this.http.get<Cashout[]>(`${this.apiUrl}/agency`);
  }

  confirm(id: string): Observable<Cashout> {
    return this.http.patch<Cashout>(`${this.apiUrl}/${id}/confirm`, {});
  }

  reject(id: string): Observable<Cashout> {
    return this.http.patch<Cashout>(`${this.apiUrl}/${id}/reject`, {});
  }
}
