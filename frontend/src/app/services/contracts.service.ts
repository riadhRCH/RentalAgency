import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Contract {
  _id?: string;
  agencyId?: string;
  transactionId: string | any;
  title: string;
  content: Record<string, any>;
  isFinalized?: boolean;
  generatedFileUrl?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractPayload {
  transactionId: string;
  title?: string;
  content?: Record<string, any>;
}

export interface UpdateContractPayload {
  title?: string;
  content?: Record<string, any>;
  isFinalized?: boolean;
  generatedFileUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/contracts`;

  constructor(private http: HttpClient) {}

  create(payload: CreateContractPayload): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, payload);
  }

  findAll(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`);
  }

  update(id: string, payload: UpdateContractPayload): Observable<Contract> {
    return this.http.patch<Contract>(`${this.apiUrl}/${id}`, payload);
  }

  generate(id: string): Observable<Contract> {
    return this.http.post<Contract>(`${this.apiUrl}/${id}/generate`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
