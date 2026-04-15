import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PropertiesService, Property } from '../../services/properties.service';
import { TransactionsService } from '../../services/transactions.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, CalendarSelectorComponent, PublicNavbarComponent, PublicFooterComponent],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private propertiesService = inject(PropertiesService);
  private transactionsService = inject(TransactionsService);
  private fb = inject(FormBuilder);

  property = signal<Property | undefined>(undefined);
  isLoading = signal(true);
  videoLoaded = signal(false);
  currentImageIndex = signal(0);
  reservationForm: FormGroup;
  isSubmitting = signal(false);
  reservationError = signal<string | null>(null);
  phoneInputInvalid = signal(false);
  showCalendarModal = signal(false);
  transactionId = signal<string | null>(null);
  selectedDatesForSubmit = signal<Date[]>([]);

  constructor() {
    this.reservationForm = this.fb.group({
      customerPhone: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadProperty();
  }

  loadProperty(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (!propertyId) return;

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
    const prop = this.property();
    return prop?.previewVideo || (prop?.photos?.[0] || '');
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

  onSelectedDates(dates: Date[]): void {
    this.selectedDatesForSubmit.set(dates);
  }

  initiateReservation(): void {
    const phoneControl = this.reservationForm.get('customerPhone');
    
    if (!phoneControl?.value || phoneControl?.invalid) {
      this.phoneInputInvalid.set(true);
      phoneControl?.markAsTouched();
      return;
    }

    // Phone is valid, now show calendar modal for daily properties
    const prop = this.property();
    if (!prop) return;

    if (prop.paymentFrequency === 'DAILY') {
      this.showCalendarModal.set(true);
    } else {
      // For non-daily properties, proceed with reservation directly
      this.submitReservation([]);
    }
  }

  confirmReservationWithDates(): void {
    const prop = this.property();
    if (!prop) return;

    const selectedDates = this.selectedDatesForSubmit();
    this.submitReservation(selectedDates);
  }

  closeCalendarModal(): void {
    this.showCalendarModal.set(false);
    this.selectedDatesForSubmit.set([]);
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

    this.transactionsService.create(reservationData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showCalendarModal.set(false);
        alert(this.i18n.translate('PROPERTY_DETAILS.RESERVATION_SUCCESS'));
        this.reservationForm.reset();
        this.phoneInputInvalid.set(false);
        this.selectedDatesForSubmit.set([]);
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

  getGoogleMapsEmbedUrl(): string {
    const prop = this.property();
    if (!prop?.gpsLocation) return '';

    const { lat, lng } = prop.gpsLocation;
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.5!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat}%2C${lng}!5e0!3m2!1sen!2s!4v1234567890`;
  }
}
