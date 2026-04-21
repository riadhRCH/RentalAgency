import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PersonnelService } from '../../../services/personnel.service';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { I18nService } from '../../../i18n/i18n.service';

interface Owner {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  propertiesCount: number;
  dashboardToken?: string;
}

@Component({
  selector: 'app-owners-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './owners-page.component.html',
  styleUrl: './owners-page.component.scss',
})
export class OwnersPageComponent implements OnInit {
  personnelService = inject(PersonnelService);
  readonly i18n = inject(I18nService);
  owners: Owner[] = [];
  loading = signal(false);
  generatingToken: { [key: string]: boolean } = {};
  copiedOwnerId: string | null = null;

  ngOnInit() {
    this.loadOwners();
  }

  loadOwners() {
    this.loading.set(true);
    this.personnelService.getOwners().subscribe({
      next: (response) => {
        this.owners = response.data.map((owner: any) => ({
          ...owner,
          propertiesCount: owner.propertiesCount || 0
        }));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  generateDashboardLink(ownerId: string, ownerName: string) {
    this.generatingToken = { ...this.generatingToken, [ownerId]: true };

    this.personnelService.generateDashboardToken(ownerId).subscribe({
      next: (response) => {
        this.owners = this.owners.map(o =>
          o._id === ownerId ? { ...o, dashboardToken: response.token } : o
        );
        this.generatingToken = { ...this.generatingToken, [ownerId]: false };

        // Auto-copy the generated link to clipboard
        const link = `${environment.appUrl}/owner-dashboard/${response.token}`;
        navigator.clipboard.writeText(link).then(() => {
          this.copiedOwnerId = ownerId;
          setTimeout(() => {
            this.copiedOwnerId = null;
          }, 2000);
        });
      },
      error: () => {
        this.generatingToken = { ...this.generatingToken, [ownerId]: false };
        alert(this.i18n.translate('OWNERS.GENERATE_FAILED'));
      }
    });
  }

  copyDashboardLink(ownerId: string, ownerName: string) {
    const owner = this.owners.find(o => o._id === ownerId);
    if (!owner || !owner.dashboardToken) {
      alert(this.i18n.translate('OWNERS.GENERATE_FIRST'));
      return;
    }

    const link = `${environment.appUrl}/owner-dashboard/${owner.dashboardToken}`;

    navigator.clipboard.writeText(link).then(() => {
      this.copiedOwnerId = ownerId;
      setTimeout(() => {
        this.copiedOwnerId = null;
      }, 2000);
    }).catch(() => {
      alert(this.i18n.translate('OWNERS.COPY_FAILED'));
    });
  }

  getDashboardLink(ownerId: string): string {
    const owner = this.owners.find(o => o._id === ownerId);
    if (!owner || !owner.dashboardToken) {
      return '';
    }
    return `${environment.appUrl}/owner-dashboard/${owner.dashboardToken}`;
  }
}