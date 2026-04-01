import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService, VirtualNumber, AgencySettings } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  private agencyService = inject(AgencyService);

  settings: AgencySettings = { forwardingNumber: '' };
  virtualNumbers: VirtualNumber[] = [];
  
  newNumber = {
    areaCode: '',
    label: ''
  };

  loading = true;
  saving = false;
  provisioning = false;
  message = '';
  error = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.agencyService.getSettings().subscribe({
      next: (s) => this.settings = s,
      complete: () => this.loading = false
    });

    this.agencyService.getActiveNumbers().subscribe(nums => {
      this.virtualNumbers = nums;
    });
  }

  saveSettings() {
    this.saving = true;
    this.message = '';
    this.error = '';
    this.agencyService.updateSettings(this.settings).subscribe({
      next: () => {
        this.message = 'Settings updated successfully';
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to update settings';
        this.saving = false;
      }
    });
  }

  provisionNumber() {
    if (!this.newNumber.areaCode) return;
    this.provisioning = true;
    this.message = '';
    this.error = '';
    
    this.agencyService.provisionNumber(this.newNumber.areaCode, this.newNumber.label).subscribe({
      next: () => {
        this.message = 'Number provisioned successfully';
        this.provisioning = false;
        this.newNumber = { areaCode: '', label: '' };
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to provision number';
        this.provisioning = false;
      }
    });
  }
}
