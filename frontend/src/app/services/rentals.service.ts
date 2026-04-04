import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rental {
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
export class RentalsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/rentals`;

  constructor(private http: HttpClient) {}

  create(rental: any): Observable<Rental> {
    return this.http.post<Rental>(this.apiUrl, rental);
  }

  findAll(): Observable<Rental[]> {
    return this.http.get<Rental[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Rental> {
    return this.http.get<Rental>(`${this.apiUrl}/${id}`);
  }

  update(id: string, updateData: any): Observable<Rental> {
    return this.http.patch<Rental>(`${this.apiUrl}/${id}`, updateData);
  }

  closeRental(id: string): Observable<Rental> {
    return this.http.patch<Rental>(`${this.apiUrl}/${id}/close`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
