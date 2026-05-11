import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, switchMap, BehaviorSubject } from 'rxjs';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
}

export interface Agency {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'agent';
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly AGENCY_KEY = 'active_agency_id';

  currentUser = signal<User | null>(null);
  userAgencies = signal<Agency[]>([]);
  activeAgencyId = signal<string | null>(localStorage.getItem(this.AGENCY_KEY));
  activeAgencyName = signal<string>('');
  agencyServices = signal<string[]>([]);
  
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.isAdmin ?? false);

  private refreshInProgress = new BehaviorSubject<boolean>(false);
  private servicesRefresh = new BehaviorSubject<void>(undefined);
  servicesRefresh$ = this.servicesRefresh.asObservable();
  
  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(credentials: { phone: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.access_token) {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, res.access_token);
        }
        if (res.refresh_token) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
        }
        this.currentUser.set(res.user);
      })
    );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((res) => {
        if (res.access_token) {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, res.access_token);
        }
        if (res.refresh_token) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
        }
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => {
        this.currentUser.set(res.user);
        this.userAgencies.set(res.agencies);
        
        if (this.activeAgencyId()) {
          const agency = res.agencies.find((a: Agency) => a.id === this.activeAgencyId());
          if (agency) {
            this.activeAgencyName.set(agency.name);
          }
        }

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
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.AGENCY_KEY);
    this.currentUser.set(null);
    this.userAgencies.set([]);
    this.activeAgencyId.set(null);
  }

  private restoreSession() {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (token) {
      this.getMe().subscribe({
        error: () => this.tryRefreshAndRestore()
      });
    }
  }

  private tryRefreshAndRestore() {
    this.refreshAccessToken().subscribe({
      next: () => this.getMe().subscribe(),
      error: () => this.logout()
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  updateAgencyServices(services: string[]) {
    this.agencyServices.set(services);
    this.servicesRefresh.next();
  }
}
