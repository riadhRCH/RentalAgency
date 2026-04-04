import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {
  private agencyService = inject(AgencyService);
  readonly i18n = inject(I18nService);

  staff: any[] = [];
  loading = signal(true);
  adding = false;
  
  newMember = {
    phone: '',
    role: 'agent'
  };

  message = '';
  error = '';

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.loading.set(true);
    this.agencyService.getStaff().subscribe({
      next: (res) => {
        this.staff = res || [];
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  addMember() {
    if (!this.newMember.phone) return;
    this.adding = true;
    this.message = '';
    this.error = '';

    this.agencyService.addStaff(this.newMember.phone, this.newMember.role).subscribe({
      next: () => {
        this.message = this.i18n.translate('TEAMS.STAFF_MEMBER_ADDED');
        this.newMember = { phone: '', role: 'agent' };
        this.adding = false;
        this.loadStaff();
      },
      error: (err) => {
        this.error = err.error?.message || this.i18n.translate('TEAMS.STAFF_MEMBER_ADD_FAILED');
        this.adding = false;
      }
    });
  }

  removeMember(personnelId: string) {
    if (confirm(this.i18n.translate('CONFIRM.REMOVE_STAFF'))) {
      this.agencyService.removeStaff(personnelId).subscribe({
        next: () => this.loadStaff(),
        error: (err) => alert(err.error?.message || this.i18n.translate('TEAMS.STAFF_MEMBER_REMOVE_FAILED'))
      });
    }
  }

  getRoleLabel(role: string) {
    return role === 'admin'
      ? this.i18n.translate('COMMON.ADMIN')
      : this.i18n.translate('COMMON.AGENT');
  }
}
