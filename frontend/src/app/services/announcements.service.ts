import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentType, PropertyStatus, PropertyType } from '../shared/enums';

export interface Announcement {
  _id: string;
  agencyId: string;
  propertyId: string;
  reference: string;
  type: PropertyType;
  title: string;
  address: string;
  gpsLocation: { lat: number; lng: number };
  surface: number;
  price: number;
  paymentFrequency: PaymentType;
  description: string;
  photos: string[];
  previewVideo?: string;
  propertyStatus: PropertyStatus;
  amenities: Record<string, any>;
  views: number;
  isVisible: boolean;
  publishedAt: string;
  refreshedAt?: string;
  hiddenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAnnouncements {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AnnouncementFilters = Record<
  string,
  string | number | Array<string | number> | undefined
>;

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/announcements`;

  constructor(private readonly http: HttpClient) {}

  getAgencyAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl);
  }

  createAnnouncement(propertyId: string): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, { propertyId });
  }

  updateVisibility(id: string, isVisible: boolean): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/${id}/visibility`, { isVisible });
  }

  refreshAnnouncement(id: string): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/${id}/refresh`, {});
  }

  deleteAnnouncement(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getPublicAgencyAnnouncements(
    agencyId: string,
    page = 1,
    limit = 12,
    filters?: AnnouncementFilters,
  ): Observable<PaginatedAnnouncements> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value
          .filter((item) => item !== undefined && item !== null && item !== '')
          .forEach((item) => {
            params = params.append(key, item);
          });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PaginatedAnnouncements>(
      `${this.apiUrl}/public/agency/${agencyId}`,
      { params },
    );
  }

  getAllPublicAnnouncements(
    page = 1,
    limit = 12,
    filters?: AnnouncementFilters,
  ): Observable<PaginatedAnnouncements> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value
          .filter((item) => item !== undefined && item !== null && item !== '')
          .forEach((item) => {
            params = params.append(key, item);
          });
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PaginatedAnnouncements>(
      `${this.apiUrl}/public`,
      { params },
    );
  }

  getPublicAnnouncement(id: string): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/public/${id}`);
  }
}
