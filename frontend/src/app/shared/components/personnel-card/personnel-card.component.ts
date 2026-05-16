import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-personnel-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a *ngIf="personnel?._id; else staticCard"
       [routerLink]="['/dashboard/personnel/profile', personnel._id]"
       (click)="$event.stopPropagation()"
       class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all no-underline">
      <div class="h-10 w-10 rounded-full overflow-hidden flex-shrink-0"
           [ngClass]="{'bg-primary/10 flex items-center justify-center text-primary': !displayProfilePicture}">
        <img *ngIf="displayProfilePicture" [src]="displayProfilePicture" alt="" class="w-full h-full object-cover" />
        <span *ngIf="!displayProfilePicture" class="material-symbols-outlined">person</span>
      </div>
      <div class="min-w-0">
        <div class="text-xs font-bold text-slate-200 truncate">{{ displayName }}</div>
        <div class="text-[10px] text-slate-500">{{ displayPhone }}</div>
      </div>
    </a>
    <ng-template #staticCard>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
        <div class="h-10 w-10 rounded-full overflow-hidden flex-shrink-0"
             [ngClass]="{'bg-primary/10 flex items-center justify-center text-primary': !displayProfilePicture}">
          <img *ngIf="displayProfilePicture" [src]="displayProfilePicture" alt="" class="w-full h-full object-cover" />
          <span *ngIf="!displayProfilePicture" class="material-symbols-outlined">person</span>
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-slate-200 truncate">{{ displayName }}</div>
          <div class="text-[10px] text-slate-500">{{ displayPhone }}</div>
        </div>
      </div>
    </ng-template>
  `
})
export class PersonnelCardComponent {
  @Input() personnel: any = null;
  @Input() name: string = '';
  @Input() phone: string = '';

  get displayName(): string {
    if (this.personnel) {
      const p = this.personnel;
      return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A';
    }
    return this.name || 'N/A';
  }

  get displayPhone(): string {
    if (this.personnel) return this.personnel.phone || 'N/A';
    return this.phone || 'N/A';
  }

  get displayProfilePicture(): string {
    if (this.personnel) return this.personnel.profilePicture || '';
    return '';
  }
}
