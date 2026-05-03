import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PersonnelService, Personnel } from '../../../services/personnel.service';
import { I18nService } from '../../../i18n/i18n.service';
import { TranslatePipe } from '../../../i18n/translate.pipe';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  private readonly personnelService = inject(PersonnelService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);

  loading = signal(false);
  saving = signal(false);
  personnel = signal<Personnel | null>(null);
  saveSuccess = signal(false);

  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'PHONE',
    instagram: '',
    facebook: '',
    telegram: '',
    profilePicture: '',
    status: 'active',
  };

  preferredContactOptions = [
    { value: 'PHONE', label: 'Phone' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TELEGRAM', label: 'Telegram' },
    { value: 'SMS', label: 'SMS' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPersonnel(id);
    }
  }

  loadPersonnel(id: string) {
    this.loading.set(true);
    this.personnelService.getOnePersonnel(id).subscribe({
      next: (data) => {
        this.personnel.set(data);
        this.editForm = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          preferredContact: data.preferredContact || 'PHONE',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          telegram: data.telegram || '',
          profilePicture: data.profilePicture || '',
          status: data.status || 'active',
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const personnelId = this.personnel()?._id;
      if (!personnelId) return;

      this.saving.set(true);
      this.personnelService.uploadProfilePicture(personnelId, file).subscribe({
        next: (response) => {
          this.editForm.profilePicture = response.profilePicture;
          this.saving.set(false);
          if (this.personnel()) {
            const current = this.personnel()!;
            this.personnel.set({ ...current, profilePicture: response.profilePicture });
          }
        },
        error: () => {
          this.saving.set(false);
        },
      });
    }
  }

  save() {
    const personnelId = this.personnel()?._id;
    if (!personnelId) return;

    this.saving.set(true);
    this.saveSuccess.set(false);
    this.personnelService.updatePersonnel(personnelId, this.editForm).subscribe({
      next: (data) => {
        this.personnel.set(data);
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  isFieldRequired(): boolean {
    const pc = this.editForm.preferredContact;
    return pc === 'EMAIL' || pc === 'PHONE' || pc === 'WHATSAPP' || pc === 'SMS';
  }

  getRequiredFieldName(): string | null {
    const pc = this.editForm.preferredContact;
    switch (pc) {
      case 'EMAIL':
        return 'email';
      case 'PHONE':
      case 'WHATSAPP':
      case 'SMS':
        return 'phone';
      default:
        return null;
    }
  }
}
