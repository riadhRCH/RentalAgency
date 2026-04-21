import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PersonnelService } from '../../../services/personnel.service';
import { environment } from '../../../../environments/environment';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './owners-page.component.html',
  styleUrl: './owners-page.component.scss',
})
export class OwnersPageComponent implements OnInit {
  personnelService = inject(PersonnelService);
  owners: Owner[] = [];
  loading = false;
  generatingToken: { [key: string]: boolean } = {};
  copiedOwnerId: string | null = null;

  ngOnInit() {
    this.loadOwners();
  }

  loadOwners() {
    this.loading = true;
    this.personnelService.getPersonnel().subscribe({
      next: (response) => {
        // Get all personnel
        this.owners = response.data
          .map((owner: any) => ({
            ...owner,
            propertiesCount: 0
          }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  generateDashboardLink(ownerId: string, ownerName: string) {
    this.generatingToken[ownerId] = true;
    
    this.personnelService.generateDashboardToken(ownerId).subscribe({
      next: (response) => {
        const owner = this.owners.find(o => o._id === ownerId);
        if (owner) {
          owner.dashboardToken = response.token;
        }
        this.generatingToken[ownerId] = false;
      },
      error: () => {
        this.generatingToken[ownerId] = false;
        alert('Failed to generate dashboard link');
      }
    });
  }

  copyDashboardLink(ownerId: string, ownerName: string) {
    const owner = this.owners.find(o => o._id === ownerId);
    if (!owner || !owner.dashboardToken) {
      alert('Please generate a dashboard link first');
      return;
    }

    const link = `${environment.appUrl}/owner-dashboard/${owner.dashboardToken}`;
    
    navigator.clipboard.writeText(link).then(() => {
      this.copiedOwnerId = ownerId;
      setTimeout(() => {
        this.copiedOwnerId = null;
      }, 2000);
    }).catch(() => {
      alert('Failed to copy link to clipboard');
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