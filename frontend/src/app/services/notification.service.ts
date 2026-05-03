import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  sentVia?: string;
  sendError?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {});
  }
}
