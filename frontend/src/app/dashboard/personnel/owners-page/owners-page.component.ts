import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnelService } from '../../../services/personnel.service';

interface Owner {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  propertiesCount: number;
}

@Component({
  selector: 'app-owners-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owners-page.component.html',
  styleUrl: './owners-page.component.scss',
})
export class OwnersPageComponent implements OnInit {
  personnelService = inject(PersonnelService);
  owners: Owner[] = [];
  loading = false;

  ngOnInit() {
    this.loadOwners();
  }

  loadOwners() {
    this.loading = true;
    // Assuming personnel service has a method to get owners with property counts
    this.personnelService.getPersonnel().subscribe({
      next: (response) => {
        // Filter to get only owners (those with properties)
        this.owners = response.data
          .filter((person: any) => person.role === 'owner')
          .map((owner: any) => ({
            ...owner,
            propertiesCount: 0 // This would need to be calculated from properties
          }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}