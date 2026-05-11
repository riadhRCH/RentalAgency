import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Agency {
  id: string;
  name: string;
  owner: { id: string; phone: string; firstName: string; lastName: string } | null;
  staffCount: number;
  services: string[];
  createdAt: string;
}

@Component({
  selector: 'app-agencies-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Agencies Management</h1>
        <p class="text-silver-400 text-sm mt-1">View and manage all registered agencies</p>
      </div>

      <div *ngIf="loading()" class="text-center py-12 text-silver-400">Loading agencies...</div>

      <div *ngIf="error()" class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-4">
        {{ error() }}
      </div>

      <div *ngIf="!loading() && agencies().length === 0" class="text-center py-12 text-silver-400">
        No agencies found.
      </div>

      <div *ngIf="!loading() && agencies().length > 0" class="space-y-4">
        <div *ngFor="let agency of agencies()" class="glass-card border border-slate-800/50 rounded-xl p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-bold text-lg truncate">{{ agency.name }}</h3>
              <p class="text-silver-400 text-sm mt-1">
                Owner: {{ agency.owner?.firstName || 'N/A' }} {{ agency.owner?.lastName || '' }}
                <span *ngIf="agency.owner">({{ agency.owner.phone }})</span>
              </p>
              <div class="flex items-center gap-4 mt-2 text-xs text-silver-500">
                <span>{{ agency.staffCount }} staff</span>
                <span>{{ agency.services?.join(', ') || 'No services' }}</span>
                <span>Created: {{ agency.createdAt | date:'shortDate' }}</span>
              </div>
            </div>
            <div class="relative">
              <button (click)="toggleChecklist(agency)" class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all">
                Delete
              </button>
              <div *ngIf="showChecklist() === agency.id" class="absolute right-0 top-12 w-72 glass-card border border-slate-700/50 rounded-xl p-4 shadow-2xl z-10">
                <h4 class="text-white text-sm font-bold mb-3">Delete {{ agency.name }}?</h4>
                <label class="flex items-center gap-3 py-2 cursor-pointer">
                  <input type="checkbox" [checked]="deletePropertiesChecked()" (change)="deletePropertiesChecked.set(!deletePropertiesChecked())" class="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary">
                  <span class="text-silver-300 text-sm">Delete properties ({{ 'including announcements & files' }})</span>
                </label>
                <label class="flex items-center gap-3 py-2 cursor-pointer">
                  <input type="checkbox" [checked]="deletePersonnelChecked()" (change)="deletePersonnelChecked.set(!deletePersonnelChecked())" class="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary">
                  <span class="text-silver-300 text-sm">Delete personnel (owners & staff)</span>
                </label>
                <div class="flex gap-2 mt-4">
                  <button (click)="showChecklist.set(null)" class="flex-1 px-3 py-2 bg-slate-800 text-silver-300 rounded-lg text-sm hover:bg-slate-700 transition-all">Cancel</button>
                  <button (click)="confirmDelete(agency)" [disabled]="deleting()" class="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50">
                    {{ deleting() ? 'Deleting...' : 'Confirm Delete' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
  `]
})
export class AgenciesManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin`;

  agencies = signal<Agency[]>([]);
  loading = signal(true);
  error = signal('');
  deleting = signal(false);

  showChecklist = signal<string | null>(null);
  deletePropertiesChecked = signal(true);
  deletePersonnelChecked = signal(true);

  ngOnInit() {
    this.loadAgencies();
  }

  loadAgencies() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Agency[]>(`${this.apiUrl}/agencies`).subscribe({
      next: (data) => {
        this.agencies.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load agencies');
        this.loading.set(false);
      }
    });
  }

  toggleChecklist(agency: Agency) {
    this.showChecklist.set(this.showChecklist() === agency.id ? null : agency.id);
    this.deletePropertiesChecked.set(true);
    this.deletePersonnelChecked.set(true);
  }

  confirmDelete(agency: Agency) {
    this.deleting.set(true);
    const params = new URLSearchParams({
      deleteProperties: String(this.deletePropertiesChecked()),
      deletePersonnel: String(this.deletePersonnelChecked()),
    });
    this.http.delete(`${this.apiUrl}/agencies/${agency.id}?${params}`).subscribe({
      next: () => {
        this.agencies.set(this.agencies().filter(a => a.id !== agency.id));
        this.showChecklist.set(null);
        this.deleting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to delete agency');
        this.deleting.set(false);
      }
    });
  }
}
