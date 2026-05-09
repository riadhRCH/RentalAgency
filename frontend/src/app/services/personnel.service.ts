import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Personnel {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
  preferredContact?: string;
  profilePicture?: string;
  instagram?: string;
  facebook?: string;
  telegram?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private readonly apiUrl = `${environment.apiBaseUrl}/personnel`;

  constructor(private http: HttpClient) {}

  getPersonnel(page = 1, limit = 100): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getOwners(page = 1, limit = 100): Observable<any> {
    return this.http.get(`${this.apiUrl}/owners?page=${page}&limit=${limit}`);
  }

  getOnePersonnel(id: string): Observable<Personnel> {
    return this.http.get<Personnel>(`${this.apiUrl}/${id}`);
  }

  createPersonnel(data: any): Observable<Personnel> {
    const sanitized = { ...data };
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/^\+216/, '');
    }
    return this.http.post<Personnel>(this.apiUrl, sanitized);
  }

  updatePersonnel(id: string, data: any): Observable<Personnel> {
    return this.http.patch<Personnel>(`${this.apiUrl}/${id}`, data);
  }

  deletePersonnel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createOrUpdatePersonnel(data: any): Observable<Personnel> {
    const sanitized = { ...data };
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/^\+216/, '');
    }
    return this.http.post<Personnel>(`${this.apiUrl}/public`, sanitized);
  }

  generateDashboardToken(id: string): Observable<{ token: string; expiresAt: Date }> {
    return this.http.post<{ token: string; expiresAt: Date }>(`${this.apiUrl}/${id}/generate-dashboard-token`, {});
  }

  getOwnerDashboard(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/${token}`);
  }

  updatePropertyAvailability(token: string, propertyId: string, calendarData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/dashboard/${token}/property/${propertyId}/availability`, { calendarData });
  }

  updatePropertyPrice(token: string, propertyId: string, price: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/dashboard/${token}/property/${propertyId}/price`, { price });
  }

  updatePropertyWifiCode(token: string, propertyId: string, wifiCode: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/dashboard/${token}/property/${propertyId}/wifi-code`, { wifiCode });
  }

  uploadProfilePicture(personnelId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/${personnelId}/profile-picture`, formData);
  }

  updateOwnerProfile(token: string, data: any): Observable<Personnel> {
    return this.http.patch<Personnel>(`${this.apiUrl}/dashboard/${token}/profile`, data);
  }

  uploadOwnerProfilePicture(token: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/dashboard/${token}/profile-picture`, formData);
  }
}
