import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface Agency {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'agent';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly AGENCY_KEY = 'active_agency_id';

  currentUser = signal<User | null>(null);
  userAgencies = signal<Agency[]>([]);
  activeAgencyId = signal<string | null>(localStorage.getItem(this.AGENCY_KEY));
  
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(credentials: { phone: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        this.currentUser.set(res.user);
        // We don't set agency here, user must choose or it will be set by getMe
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => {
        this.currentUser.set(res.user);
        this.userAgencies.set(res.agencies);
        
        // If only one agency, set it as active automatically
        if (res.agencies.length === 1 && !this.activeAgencyId()) {
          this.setActiveAgency(res.agencies[0].id);
        }
      })
    );
  }

  setActiveAgency(agencyId: string) {
    localStorage.setItem(this.AGENCY_KEY, agencyId);
    this.activeAgencyId.set(agencyId);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.AGENCY_KEY);
    this.currentUser.set(null);
    this.userAgencies.set([]);
    this.activeAgencyId.set(null);
  }

  private restoreSession() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.getMe().subscribe({
        error: () => this.logout()
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
