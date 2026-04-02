import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';
import { PersonnelService } from '../../../services/personnel.service';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss']
})
export class AddPropertyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertiesService = inject(PropertiesService);
  private personnelService = inject(PersonnelService);
  private router = inject(Router);

  propertyForm: FormGroup;
  loading = signal(false);
  personnel = signal<any[]>([]);

  constructor() {
    this.propertyForm = this.fb.group({
      type: ['apartment', Validators.required],
      address: ['', Validators.required],
      surface: [null, [Validators.required, Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      status: ['available', Validators.required],
      ownerId: ['', Validators.required],
      gpsLocation: this.fb.group({
        lat: [0, Validators.required],
        lng: [0, Validators.required]
      }),
      photos: [[]],
      videos: [[]],
      amenities: this.fb.group({
        bedrooms: [0],
        bathrooms: [0],
        parking: [false],
        furnished: [false],
        pool: [false],
        garden: [false]
      })
    });
  }

  ngOnInit() {
    this.loadPersonnel();
  }

  loadPersonnel() {
    this.personnelService.getPersonnel().subscribe({
      next: (res: any) => this.personnel.set(res.data || []),
      error: (err) => console.error('Error loading personnel', err)
    });
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      this.loading.set(true);
      const formData = this.propertyForm.value;
      
      this.propertiesService.createProperty(formData).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard/properties']);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Error creating property', err);
        }
      });
    } else {
      this.propertyForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/properties']);
  }
}
