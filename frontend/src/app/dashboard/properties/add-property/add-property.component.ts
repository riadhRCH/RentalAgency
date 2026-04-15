import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { PropertiesService } from '../../../services/properties.service';
import { PersonnelService } from '../../../services/personnel.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { PropertyType, PropertyStatus, PaymentFrequency, getEnumValues } from '../../../shared/enums';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PhoneInputComponent, TranslatePipe, GoogleMapsModule],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss']
})
export class AddPropertyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertiesService = inject(PropertiesService);
  private personnelService = inject(PersonnelService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  // Expose enums to template
  PropertyType = PropertyType;
  PropertyStatus = PropertyStatus;
  paymentFrequency = PaymentFrequency;
  propertyTypes = getEnumValues(PropertyType);
  propertyStatuses = getEnumValues(PropertyStatus);
  paymentFrequencys = getEnumValues(PaymentFrequency);

  propertyForm: FormGroup;
  loading = signal(false);
  uploading = signal(false);
  personnel = signal<any[]>([]);
  uploadedPhotos = signal<string[]>([]);
  ownerSelectionMode = signal<'existing' | 'new'>('existing');
  propertyId: string | null = null;
  isEditMode = signal(false);
  
  // Collapsible sections
  basicInfoExpanded = signal(true);
  detailsExpanded = signal(false);
  imagesExpanded = signal(false);
  locationExpanded = signal(false);

  // Google Maps properties
  mapLoading = signal(false);
  mapCenter: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1686 }; // Default to Tunisia
  mapZoom = 12;
  markerPosition: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1686 };
  markerOptions: google.maps.MarkerOptions = {
    draggable: true,
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

  constructor() {
    this.propertyForm = this.fb.group({
      type: [PropertyType.APARTMENT, Validators.required],
      address: ['', Validators.required],
      surface: [null, [Validators.required, Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(0)]],
      paymentFrequency: [PaymentFrequency.MONTHLY, Validators.required],
      googleMapsLink: [''],
      description: ['', Validators.required],
      status: [PropertyStatus.AVAILABLE, Validators.required],
      ownerId: [''],
      ownerPhone: [''],
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

    this.updateOwnerValidators();
  }

  setOwnerSelectionMode(mode: 'existing' | 'new') {
    this.ownerSelectionMode.set(mode);
    this.updateOwnerValidators();
  }

  private updateOwnerValidators() {
    const ownerIdControl = this.propertyForm.get('ownerId');
    const ownerPhoneControl = this.propertyForm.get('ownerPhone');

    if (this.ownerSelectionMode() === 'existing') {
      ownerIdControl?.setValidators([Validators.required]);
      ownerPhoneControl?.clearValidators();
      ownerPhoneControl?.setValue('');
    } else {
      ownerPhoneControl?.setValidators([Validators.required]);
      ownerIdControl?.clearValidators();
      ownerIdControl?.setValue('');
    }

    ownerIdControl?.updateValueAndValidity();
    ownerPhoneControl?.updateValueAndValidity();
  }

  ngOnInit() {
    this.loadPersonnel();
    this.checkEditMode();
  }

  prevewLink() {
    console.log(`${environment.appUrl}/property/${this.propertyId}`)
    window.open(`${environment.appUrl}/property/${this.propertyId}`, '_blank');
  }

  checkEditMode() {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    if (this.propertyId) {
      this.isEditMode.set(true);
      this.loading.set(true);
      this.propertiesService.getProperty(this.propertyId).subscribe({
        next: (prop: any) => {
          this.propertyForm.patchValue({
            type: prop.type,
            address: prop.address,
            surface: prop.surface,
            price: prop.price,
            paymentFrequency: prop.paymentFrequency || 'monthly',
            googleMapsLink: prop.googleMapsLink || '',
            description: prop.description,
            status: prop.status,
            ownerId: prop.ownerId?._id || prop.ownerId,
            gpsLocation: prop.gpsLocation,
            amenities: prop.amenities
          });
          // Set map to property location
          if (prop.gpsLocation && prop.gpsLocation.lat && prop.gpsLocation.lng) {
            this.markerPosition = { lat: prop.gpsLocation.lat, lng: prop.gpsLocation.lng };
            this.mapCenter = { lat: prop.gpsLocation.lat, lng: prop.gpsLocation.lng };
            this.mapOptions = { ...this.mapOptions, center: { lat: prop.gpsLocation.lat, lng: prop.gpsLocation.lng } };
          }
          this.uploadedPhotos.set(prop.photos || []);
          this.propertyForm.get('photos')?.setValue(this.uploadedPhotos());
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading property', err);
          this.loading.set(false);
        }
      });
    }
  }

  loadPersonnel() {
    this.personnelService.getPersonnel().subscribe({
      next: (res: any) => this.personnel.set(res.data || []),
      error: (err) => console.error('Error loading personnel', err)
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploading.set(true);
      const uploadPromises = Array.from(files).map((file: any) => 
        this.propertiesService.uploadImage(file).toPromise()
      );

      Promise.all(uploadPromises)
        .then(results => {
          const urls = results.map(r => r?.url).filter(url => !!url) as string[];
          this.uploadedPhotos.update(photos => [...photos, ...urls]);
          this.propertyForm.get('photos')?.setValue(this.uploadedPhotos());
          this.uploading.set(false);
        })
        .catch(err => {
          this.uploading.set(false);
          console.error('Error uploading images', err);
        });
    }
  }

  removePhoto(index: number) {
    this.uploadedPhotos.update(photos => photos.filter((_, i) => i !== index));
    this.propertyForm.get('photos')?.setValue(this.uploadedPhotos());
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      this.loading.set(true);
      const formData = this.propertyForm.value;
      
      const request = this.isEditMode() && this.propertyId
        ? this.propertiesService.updateProperty(this.propertyId, formData)
        : this.propertiesService.createProperty(formData);

      request.subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard/properties']);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(`Error ${this.isEditMode() ? 'updating' : 'creating'} property`, err);
        }
      });
    } else {
      this.propertyForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/properties']);
  }

  onGoogleMapsLinkPaste(link: string) {
    // Extract coordinates from Google Maps link
    // Does support these formats:
    // https://www.google.com/maps/place/33.5731,-7.5898
    // https://www.google.com/maps/@33.5731,-7.5898,...
    // https://maps.google.com/?q=33.5731,-7.5898
    
    const coordPattern = /([\d.-]+),\s*([\d.-]+)/;
    const match = link.match(coordPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        this.propertyForm.get('gpsLocation')?.patchValue({
          lat: lat,
          lng: lng
        });
        
        // Attempt to reverse geocode (fetch address from coordinates)
        this.reverseGeocodeCoordinates(lat, lng);
      }
    }
  }

  private reverseGeocodeCoordinates(lat: number, lng: number) {
    // Using OpenStreetMap Nominatim reverse geocoding service (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.address) {
          // Build address from components
          const addressParts = [];
          if (data.address.house_number) addressParts.push(data.address.house_number);
          if (data.address.road) addressParts.push(data.address.road);
          if (data.address.suburb) addressParts.push(data.address.suburb);
          if (data.address.city) addressParts.push(data.address.city);
          if (data.address.postcode) addressParts.push(data.address.postcode);
          if (data.address.country) addressParts.push(data.address.country);
          
          const fullAddress = addressParts.join(', ');
          if (fullAddress) {
            this.propertyForm.get('address')?.setValue(fullAddress);
          }
        }
      })
      .catch(err => console.warn('Could not reverse geocode address:', err));
  }

  toggleSection(section: 'basicInfo' | 'details' | 'images' | 'location') {
    switch (section) {
      case 'basicInfo':
        this.basicInfoExpanded.update(v => !v);
        break;
      case 'details':
        this.detailsExpanded.update(v => !v);
        break;
      case 'images':
        this.imagesExpanded.update(v => !v);
        break;
      case 'location':
        this.locationExpanded.update(v => !v);
        this.initializeMapIfNeeded();
        break;
    }
  }

  private initializeMapIfNeeded() {
    // This will ensure the map is initialized when the section is expanded
    setTimeout(() => {
      if (this.googleMap && (this.googleMap as any).mapElement) {
        google.maps.event.trigger((this.googleMap as any).mapElement, 'resize');
      }
    }, 100);
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      this.markerPosition = { lat, lng };
      this.mapCenter = { lat, lng };
      
      // Update form with selected coordinates
      this.propertyForm.get('gpsLocation')?.patchValue({
        lat: lat,
        lng: lng
      });
      
      // Reverse geocode to get address
      this.reverseGeocodeCoordinates(lat, lng);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent | any) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      this.markerPosition = { lat, lng };
      
      // Update form with new coordinates
      this.propertyForm.get('gpsLocation')?.patchValue({
        lat: lat,
        lng: lng
      });
      
      // Reverse geocode to get address
      this.reverseGeocodeCoordinates(lat, lng);
    }
  }

  centerMapOnMarker() {
    const gpsLocation = this.propertyForm.get('gpsLocation')?.value;
    if (gpsLocation && gpsLocation.lat && gpsLocation.lng) {
      this.mapCenter = { lat: gpsLocation.lat, lng: gpsLocation.lng };
      this.markerPosition = { lat: gpsLocation.lat, lng: gpsLocation.lng };
    }
  }
}
