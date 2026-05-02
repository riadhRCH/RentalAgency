import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentType, PropertyStatus, PropertyType } from '../shared/enums';

export interface DayAvailability {
  date: Date | string;
  isAvailable: boolean;
}

export interface Property {
  _id: string;
  agencyId: string;
  reference: string;
  type: PropertyType;
  address: string;
  gpsLocation: { lat: number; lng: number };
  surface: number;
  price: number;
  description: string;
  photos: string[];
  videos: string[];
  previewVideo?: string;
  status: PropertyStatus;
  ownerId: any;
  amenities: Record<string, any>;
  createdAt: Date;
  paymentFrequency: PaymentType;
  calendarData?: DayAvailability[];
  googleMapsLink?: string;
}

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/properties`;

  constructor(private http: HttpClient) {}

  getProperties(page = 1, limit = 20, filters?: any): Observable<PaginatedProperties> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) url += `&${key}=${filters[key]}`;
      });
    }
    return this.http.get<PaginatedProperties>(url);
  }

  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  getPublicProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/public/${id}`);
  }

  getPublicProperties(page = 1, limit = 20, filters?: any): Observable<PaginatedProperties> {
    let url = `${this.apiUrl}/public?page=${page}&limit=${limit}`;
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) url += `&${key}=${filters[key]}`;
      });
    }
    return this.http.get<PaginatedProperties>(url);
  }

  createProperty(data: any): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, data);
  }

  uploadImage(file: File): Observable<{ url: string; public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; public_id: string }>(`${this.apiUrl}/upload`, formData);
  }

  uploadVideo(file: File): Observable<{ url: string; public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; public_id: string }>(`${this.apiUrl}/upload-video`, formData);
  }

  updateProperty(id: string, data: any): Observable<Property> {
    return this.http.patch<Property>(`${this.apiUrl}/${id}`, data);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
