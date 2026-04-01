import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent],
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {
  private agencyService = inject(AgencyService);

  staff: any[] = [];
  loading = true;
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
    this.loading = true;
    this.agencyService.getStaff().subscribe({
      next: (res) => this.staff = res,
      complete: () => this.loading = false
    });
  }

  addMember() {
    if (!this.newMember.phone) return;
    this.adding = true;
    this.message = '';
    this.error = '';

    this.agencyService.addStaff(this.newMember.phone, this.newMember.role).subscribe({
      next: () => {
        this.message = 'Staff member added successfully';
        this.newMember = { phone: '', role: 'agent' };
        this.adding = false;
        this.loadStaff();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add staff member';
        this.adding = false;
      }
    });
  }

  removeMember(personnelId: string) {
    if (confirm('Are you sure you want to remove this staff member?')) {
      this.agencyService.removeStaff(personnelId).subscribe({
        next: () => this.loadStaff(),
        error: (err) => alert(err.error?.message || 'Failed to remove staff member')
      });
    }
  }
}
