import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Transaction {
  _id?: string;
  agencyId: string;
  propertyId: any;
  personnelId: any;
  financialDetails: {
    rentAmount: number;
    depositAmount: number;
    paymentFrequency?: string;
  };
  timeline: {
    startDate: string | Date;
    duration: number;
    endDate: string | Date;
    renewalDate?: string | Date;
  };
  metadata?: {
    documents?: string[];
    utilityNotes?: string;
    emergencyContact?: string;
  };
  status: 'CURRENT' | 'EXPIRING_SOON' | 'OVERDUE' | 'CLOSED';
  identityVerificationStatus?: string;
  source?: {
    sourceType: 'LEAD' | 'VISIT' | 'DIRECT';
    sourceId?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/transactions`;

  constructor(private http: HttpClient) {}

  create(transaction: any): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  findAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  update(id: string, updateData: any): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}`, updateData);
  }

  closeTransaction(id: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/close`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
