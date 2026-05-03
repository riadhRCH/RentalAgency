import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly AGENCY_KEY = 'active_agency_id';

  currentUser = signal<User | null>(null);
  userAgencies = signal<Agency[]>([]);
  activeAgencyId = signal<string | null>(localStorage.getItem(this.AGENCY_KEY));
  activeAgencyName = signal<string>('');
  
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
        
        // Update active agency name if agencies loaded
        if (this.activeAgencyId()) {
          const agency = res.agencies.find((a: Agency) => a.id === this.activeAgencyId());
          if (agency) {
            this.activeAgencyName.set(agency.name);
          }
        }

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
    const agency = this.userAgencies().find(a => a.id === agencyId);
    if (agency) {
      this.activeAgencyName.set(agency.name);
    }
  }

  updateAgencyName(name: string) {
    this.activeAgencyName.set(name);
    const agencies = this.userAgencies();
    const agencyId = this.activeAgencyId();
    if (agencyId) {
      const updated = agencies.map(a => a.id === agencyId ? { ...a, name } : a);
      this.userAgencies.set(updated);
    }
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
