import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { PropertiesService, Property } from '../../services/properties.service';
import { TransactionsService } from '../../services/transactions.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, PublicNavbarComponent, PublicFooterComponent, GoogleMapsModule, PhoneInputComponent],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertiesService = inject(PropertiesService);
  private transactionsService = inject(TransactionsService);
  private fb = inject(FormBuilder);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  // Google Maps properties
  mapLoading = signal(false);
  mapCenter: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1686 }; // Default to Tunisia
  mapZoom = 12;
  markerPosition: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1686 };
  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  };
  mapOptions: google.maps.MapOptions = {
    center: { lat: 36.8065, lng: 10.1686 },
    zoom: 12,
    fullscreenControl: true,
    mapTypeControl: true,
    zoomControl: true,
    streetViewControl: false
  };
  googleMapsApiKey = environment.googleMapsApiKey;

  property = signal<Property | undefined>(undefined);
  isLoading = signal(true);
  videoLoaded = signal(false);
  currentImageIndex = signal(0);
  reservationForm: FormGroup;
  isSubmitting = signal(false);
  reservationError = signal<string | null>(null);
  phoneInputInvalid = signal(false);
  transactionId = signal<string | null>(null);

  private phonePattern = /^(\+\d{1,3})?0?[0-9]{8}$/;

  constructor() {
    this.reservationForm = this.fb.group({
      customerPhone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
    });
  }

  ngOnInit(): void {
    this.loadProperty();
  }

  loadProperty(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (!propertyId) return;

    this.videoLoaded.set(false);
    this.propertiesService.getPublicProperty(propertyId).subscribe({
      next: (data) => {
        this.property.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getCoverImage(): string {
    return this.property()?.photos?.[0] || '';
  }

  getGalleryImages(): string[] {
    return this.property()?.photos || [];
  }

  onVideoLoaded(): void {
    this.videoLoaded.set(true);
  }

  nextImage(): void {
    const images = this.getGalleryImages();
    if (images.length > 0) {
      this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
    }
  }

  previousImage(): void {
    const images = this.getGalleryImages();
    if (images.length > 0) {
      const newIndex = this.currentImageIndex() - 1;
      this.currentImageIndex.set(newIndex < 0 ? images.length - 1 : newIndex);
    }
  }

  getDuration(): number {
    const startDate = this.reservationForm.get('startDate')?.value;
    const endDate = this.reservationForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    if (startDate) {
      return 1;
    }

    return 0;
  }

  getEstimatedCost(): number {
    const prop = this.property();
    const duration = this.getDuration();

    if (!prop || duration === 0) return 0;

    if (prop.paymentFrequency === 'DAILY') {
      const selectedDates = this.reservationForm.get('selectedDates')?.value || [];
      return prop.price * selectedDates.length;
    } else if (prop.paymentFrequency === 'MONTHLY') {
      const months = Math.ceil(duration / 30);
      return prop.price * months;
    } else if (prop.paymentFrequency === 'WEEKLY') {
      const weeks = Math.ceil(duration / 7);
      return prop.price * weeks;
    } else if (prop.paymentFrequency === 'YEARLY') {
      const years = Math.ceil(duration / 365);
      return prop.price * years;
    }

    return prop.price * duration;
  }

  initiateReservation(): void {
    const phoneControl = this.reservationForm.get('customerPhone');
    
    if (!phoneControl?.value || phoneControl?.invalid) {
      this.phoneInputInvalid.set(true);
      phoneControl?.markAsTouched();
      return;
    }

    this.submitReservation([]);
  }

  getPhoneErrorMessage(): string {
    const phoneControl = this.reservationForm.get('customerPhone');
    if (!phoneControl?.value) {
      return 'COMMON.PHONE_REQUIRED';
    }
    if (phoneControl?.hasError('pattern')) {
      return 'COMMON.PHONE_INVALID_FORMAT';
    }
    return 'COMMON.PHONE_REQUIRED';
  }

  private submitReservation(selectedDates: Date[]): void {
    const prop = this.property();
    if (!prop) return;

    this.isSubmitting.set(true);
    this.reservationError.set(null);

    const formValue = this.reservationForm.value;
    
    let timeline: any = {
      selectedDates: selectedDates.map(d => d.toISOString().split('T')[0])
    };

    if (prop.paymentFrequency === 'DAILY') {
      timeline.duration = selectedDates.length;
    } else {
      timeline.duration = 1; // Will be calculated server-side for non-daily
    }

    const reservationData = {
      propertyId: prop._id,
      customerPhone: formValue.customerPhone,
      agencyId: prop.agencyId,
      financialDetails: {
        rentAmount: prop.price,
        depositAmount: 0,
        paymentFrequency: prop.paymentFrequency
      },
      timeline: timeline,
      metadata: {},
      source: {
        sourceType: 'DIRECT'
      }
    };

    this.transactionsService.createPublic(reservationData).subscribe({
      next: (transaction) => {
        this.isSubmitting.set(false);
        // Redirect to transaction page instead of showing alert
        this.router.navigate(['/transaction', transaction._id]);
        this.reservationForm.reset();
        this.phoneInputInvalid.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.reservationError.set(err.error?.message || this.i18n.translate('PROPERTY_DETAILS.RESERVATION_FAILED'));
      }
    });
  }

  makeReservation(): void {
    // This method is now for form submission via Enter key
    if (this.reservationForm.get('customerPhone')?.valid) {
      this.initiateReservation();
    }
  }
}
