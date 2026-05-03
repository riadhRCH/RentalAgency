# TODO-2.txt Implementation Guide

## File: backend/src/schemas/personnel.schema.ts

Replace entire file with:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PersonnelDocument = Personnel & Document;

export enum PreferredContact {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TELEGRAM = 'TELEGRAM',
  SMS = 'SMS',
}

@Schema({ timestamps: true })
export class Personnel {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop({
    type: String,
    enum: Object.values(PreferredContact),
    default: PreferredContact.PHONE,
  })
  preferredContact: string;

  @Prop()
  profilePicture: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  telegram: string;

  @Prop({
    type: String,
    enum: ['call', 'manual', 'registration', 'public'],
    default: 'manual',
  })
  source: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop()
  passwordHash?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  dashboardToken?: string;

  @Prop()
  dashboardTokenExpiresAt?: Date;

  @Prop()
  deletedAt: Date;
}

export const PersonnelSchema = SchemaFactory.createForClass(Personnel);
```

---

## File: backend/src/personnel/dto/create-personnel.dto.ts

Replace entire file with:

```typescript
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { IsValidPhone } from '../../shared/validators/is-valid-phone.validator';
import { PreferredContact } from '../../schemas/personnel.schema';

export class CreatePersonnelDto {
  @IsValidPhone()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  email?: string;

  @IsEnum(PreferredContact)
  @IsOptional()
  preferredContact?: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  telegram?: string;

  @IsEnum(['call', 'manual', 'registration'])
  @IsOptional()
  source?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
```

---

## File: backend/src/personnel/dto/update-personnel.dto.ts

Keep as-is (it extends CreatePersonnelDto via PartialType, so it will automatically inherit new fields):

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonnelDto } from './create-personnel.dto';

export class UpdatePersonnelDto extends PartialType(CreatePersonnelDto) {}
```

---

## File: backend/src/personnel/personnel.controller.ts

Replace entire file with:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgencyGuard } from '../auth/agency.guard';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { PersonnelService } from './personnel.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Public } from 'src/auth/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('personnel')
export class PersonnelController {
  constructor(
    private readonly personnelService: PersonnelService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('source') source?: string,
    @Query('status') status?: string,
  ) {
    return this.personnelService.findAll(
      parseInt(page),
      parseInt(limit),
      source,
      status,
    );
  }

  @UseGuards(AgencyGuard)
  @Get('owners')
  findOwnersByAgency(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.personnelService.findOwnersByAgency(
      req.agencyId.toString(),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personnelService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.create(dto);
  }

  @Public()
  @Post('public')
  createPublic(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.createPublic(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonnelDto) {
    return this.personnelService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personnelService.remove(id);
  }

  @Post('identify')
  identify(@Body('phone') phone: string) {
    return this.personnelService.identify(phone);
  }

  @Get(':id/context')
  getContext(@Param('id') id: string) {
    return this.personnelService.getContext(id);
  }

  @Post(':id/generate-dashboard-token')
  generateDashboardToken(@Param('id') id: string) {
    return this.personnelService.generateDashboardToken(id);
  }

  @Public()
  @Get('dashboard/:token')
  getOwnerDashboard(@Param('token') token: string) {
    return this.personnelService.getOwnerDashboardData(token);
  }

  @Public()
  @Patch('dashboard/:token/property/:propertyId/availability')
  updatePropertyAvailability(
    @Param('token') token: string,
    @Param('propertyId') propertyId: string,
    @Body('calendarData') calendarData: any,
  ) {
    return this.personnelService.updatePropertyAvailability(token, propertyId, calendarData);
  }

  @Public()
  @Patch('dashboard/:token/property/:propertyId/price')
  updatePropertyPrice(
    @Param('token') token: string,
    @Param('propertyId') propertyId: string,
    @Body('price') price: number,
  ) {
    return this.personnelService.updatePropertyPrice(token, propertyId, price);
  }

  @Post(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const result = await this.cloudinaryService.uploadImage(file);
    const profilePictureUrl = (result as any).secure_url;

    await this.personnelService.update(id, { profilePicture: profilePictureUrl });

    return {
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
    };
  }
}
```

---

## File: backend/src/personnel/personnel.module.ts

Add CloudinaryModule to imports. Replace file with:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Personnel, PersonnelSchema } from '../schemas/personnel.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Property, PropertySchema } from '../schemas/property.schema';
import { RentalAgency, RentalAgencySchema } from '../schemas/rental-agency.schema';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { Cashout, CashoutSchema } from '../schemas/cashout.schema';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Personnel.name, schema: PersonnelSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Property.name, schema: PropertySchema },
      { name: RentalAgency.name, schema: RentalAgencySchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Cashout.name, schema: CashoutSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
```

---

## File: frontend/src/app/services/personnel.service.ts

Update the Personnel interface and add upload method. Replace file with:

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Personnel {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
  preferredContact?: string;
  profilePicture?: string;
  instagram?: string;
  facebook?: string;
  telegram?: string;
}

export interface PaginatedResponse {
  data: Personnel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/personnel`;

  getPersonnel(page = 1, limit = 20): Observable<PaginatedResponse> {
    return this.http.get<PaginatedResponse>(
      `${this.apiUrl}?page=${page}&limit=${limit}`
    );
  }

  getOwners(page = 1, limit = 20): Observable<PaginatedResponse> {
    return this.http.get<PaginatedResponse>(
      `${this.apiUrl}/owners?page=${page}&limit=${limit}`
    );
  }

  getOnePersonnel(id: string): Observable<Personnel> {
    return this.http.get<Personnel>(`${this.apiUrl}/${id}`);
  }

  createPersonnel(data: any): Observable<Personnel> {
    return this.http.post<Personnel>(this.apiUrl, data);
  }

  updatePersonnel(id: string, data: any): Observable<Personnel> {
    return this.http.patch<Personnel>(`${this.apiUrl}/${id}`, data);
  }

  deletePersonnel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createOrUpdatePersonnel(data: any): Observable<Personnel> {
    return this.http.post<Personnel>(`${this.apiUrl}/public`, data);
  }

  generateDashboardToken(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/generate-dashboard-token`, {});
  }

  getOwnerDashboard(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/${token}`);
  }

  updatePropertyAvailability(
    token: string,
    propertyId: string,
    calendarData: any
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/dashboard/${token}/property/${propertyId}/availability`,
      { calendarData }
    );
  }

  updatePropertyPrice(
    token: string,
    propertyId: string,
    price: number
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/dashboard/${token}/property/${propertyId}/price`,
      { price }
    );
  }

  uploadProfilePicture(personnelId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.apiUrl}/${personnelId}/profile-picture`,
      formData
    );
  }
}
```

---

## File: frontend/src/app/app.routes.ts

Add the personnel profile route. Find the dashboard routes section and add:

```typescript
{
  path: 'dashboard/personnel/profile/:id',
  loadComponent: () =>
    import('./dashboard/personnel/profile-page/profile-page.component').then(
      (m) => m.ProfilePageComponent
    ),
  canActivate: [authGuard, agencyGuard],
},
```

---

## New Directory: frontend/src/app/dashboard/personnel/profile-page/

### File: frontend/src/app/dashboard/personnel/profile-page/profile-page.component.ts

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  loading = signal(false);
  saving = signal(false);
  loadingById = signal(false);
  personnel = signal<Personnel | null>(null);
  searchId = signal('');

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

  searchById() {
    const id = this.searchId().trim();
    if (!id) return;

    this.loadingById.set(true);
    this.personnelService.getOnePersonnel(id).subscribe({
      next: (data) => {
        this.router.navigate(['/dashboard/personnel/profile', id]);
      },
      error: () => {
        this.loadingById.set(false);
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
    this.personnelService.updatePersonnel(personnelId, this.editForm).subscribe({
      next: (data) => {
        this.personnel.set(data);
        this.saving.set(false);
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
```

### File: frontend/src/app/dashboard/personnel/profile-page/profile-page.component.html

```html
<div class="glass-card p-6 max-w-4xl mx-auto">
  <!-- Search Section -->
  <div class="mb-6 flex items-center gap-4">
    <input
      type="text"
      [(ngModel)]="searchId"
      placeholder="{{ 'PERSONNEL.SEARCH_ID' | translate }}"
      class="flex-1 bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary"
    />
    <button
      (click)="searchById()"
      [disabled]="loadingById()"
      class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
    >
      @if (loadingById()) {
        <span class="material-symbols-outlined animate-spin">progress_activity</span>
      } @else {
        {{ 'PERSONNEL.LOAD' | translate }}
      }
    </button>
  </div>

  @if (loading()) {
    <div class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
    </div>
  } @else if (personnel()) {
    <form (ngSubmit)="save()" class="space-y-6">
      <!-- Profile Picture -->
      <div class="flex items-center gap-6">
        <div class="relative">
          @if (editForm.profilePicture) {
            <img
              [src]="editForm.profilePicture"
              alt="Profile"
              class="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
          } @else {
            <div class="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/10">
              <span class="material-symbols-outlined text-4xl text-slate-400">person</span>
            </div>
          }
        </div>
        <div>
          <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.PROFILE_PICTURE' | translate }}</label>
          <input
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            [disabled]="saving()"
            class="text-silver-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary/80 disabled:file:opacity-50"
          />
        </div>
      </div>

      <!-- Name Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.FIRST_NAME' | translate }}</label>
          <input
            type="text"
            [(ngModel)]="editForm.firstName"
            name="firstName"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.LAST_NAME' | translate }}</label>
          <input
            type="text"
            [(ngModel)]="editForm.lastName"
            name="lastName"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <!-- Contact Info -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.PHONE' | translate }}</label>
          <input
            type="tel"
            [(ngModel)]="editForm.phone"
            name="phone"
            [required]="getRequiredFieldName() === 'phone'"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-white font-medium mb-2">
            {{ 'PERSONNEL.EMAIL' | translate }}
            @if (isFieldRequired() && getRequiredFieldName() === 'email') {
              <span class="text-red-500">*</span>
            }
          </label>
          <input
            type="email"
            [(ngModel)]="editForm.email"
            name="email"
            [required]="getRequiredFieldName() === 'email'"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <!-- Preferred Contact -->
      <div>
        <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.PREFERRED_CONTACT' | translate }}</label>
        <select
          [(ngModel)]="editForm.preferredContact"
          name="preferredContact"
          class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
        >
          @for (option of preferredContactOptions; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>

      <!-- Social Links -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-white font-medium mb-2">
            <span class="material-symbols-outlined text-sm align-middle mr-1">photo_camera</span>
            Instagram
          </label>
          <input
            type="text"
            [(ngModel)]="editForm.instagram"
            name="instagram"
            placeholder="username or URL"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label class="block text-white font-medium mb-2">
            <span class="material-symbols-outlined text-sm align-middle mr-1">thumb_up</span>
            Facebook
          </label>
          <input
            type="text"
            [(ngModel)]="editForm.facebook"
            name="facebook"
            placeholder="username or URL"
            class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label class="block text-white font-medium mb-2">
          <span class="material-symbols-outlined text-sm align-middle mr-1">send</span>
          Telegram
        </label>
        <input
          type="text"
          [(ngModel)]="editForm.telegram"
          name="telegram"
          placeholder="username or URL"
          class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Status -->
      <div>
        <label class="block text-white font-medium mb-2">{{ 'PERSONNEL.STATUS' | translate }}</label>
        <select
          [(ngModel)]="editForm.status"
          name="status"
          class="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
        >
          <option value="active">{{ 'PERSONNEL.ACTIVE' | translate }}</option>
          <option value="inactive">{{ 'PERSONNEL.INACTIVE' | translate }}</option>
        </select>
      </div>

      <!-- Save Button -->
      <button
        type="submit"
        [disabled]="saving()"
        class="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        @if (saving()) {
          <span class="material-symbols-outlined animate-spin">progress_activity</span>
        } @else {
          <span class="material-symbols-outlined">save</span>
        }
        {{ (saving() ? 'PERSONNEL.SAVING' : 'PERSONNEL.SAVE') | translate }}
      </button>
    </form>
  } @else {
    <div class="text-center py-12 text-slate-500">
      <span class="material-symbols-outlined text-6xl mb-4">person_search</span>
      <p>{{ 'PERSONNEL.SEARCH_PROMPT' | translate }}</p>
    </div>
  }
</div>
```

### File: frontend/src/app/dashboard/personnel/profile-page/profile-page.component.scss

```scss
:host {
  display: block;
}

input,
select {
  transition: border-color 0.2s ease;

  &:focus {
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb, 16, 185, 129), 0.2);
  }
}

.glass-card {
  backdrop-filter: blur(12px);
  background: rgba(30, 41, 59, 0.7);
}
```

---

## File: frontend/src/app/shared/components/phone-input/phone-input.component.ts

Replace with updated version including personnel navigation and contact icons:

```typescript
import { Component, Input, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.scss'],
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() personnelId?: string;
  @Input() preferredContact?: string = 'PHONE';
  @Input() personnelEmail?: string;
  @Input() personnelInstagram?: string;
  @Input() personnelFacebook?: string;
  @Input() personnelTelegram?: string;

  selectedCountry = signal({ code: 'TN', dialCode: '+216', flag: '🇹🇳' });
  phoneNumber = signal('');
  showDropdown = signal(false);

  fullNumber = computed(() => {
    return `${this.selectedCountry().dialCode}${this.phoneNumber()}`;
  });

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(private router: Router) {}

  writeValue(value: any): void {
    if (value) {
      const str = String(value);
      for (const country of [{ code: 'TN', dialCode: '+216' }]) {
        if (str.startsWith(country.dialCode)) {
          this.selectedCountry.set(country);
          this.phoneNumber.set(str.slice(country.dialCode.length).trim());
          break;
        }
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onPhoneChange(value: string): void {
    this.phoneNumber.set(value);
    this.onChange(this.fullNumber());
  }

  navigateToPersonnel() {
    if (this.personnelId) {
      this.router.navigate(['/dashboard/personnel/profile', this.personnelId]);
    }
  }

  launchContactIntent() {
    const contact = this.preferredContact || 'PHONE';
    let url = '';

    switch (contact) {
      case 'PHONE':
      case 'SMS':
        url = `tel:${this.fullNumber()}`;
        break;
      case 'WHATSAPP':
        const phoneDigits = this.fullNumber().replace(/[^0-9]/g, '');
        url = `https://wa.me/${phoneDigits}`;
        break;
      case 'EMAIL':
        url = `mailto:${this.personnelEmail || ''}`;
        break;
      case 'INSTAGRAM':
        url = this.personnelInstagram
          ? this.personnelInstagram.startsWith('http')
            ? this.personnelInstagram
            : `https://instagram.com/${this.personnelInstagram.replace('@', '')}`
          : 'https://instagram.com';
        break;
      case 'FACEBOOK':
        url = this.personnelFacebook
          ? this.personnelFacebook.startsWith('http')
            ? this.personnelFacebook
            : `https://facebook.com/${this.personnelFacebook}`
          : 'https://facebook.com';
        break;
      case 'TELEGRAM':
        url = this.personnelTelegram
          ? this.personnelTelegram.startsWith('http')
            ? this.personnelTelegram
            : `https://t.me/${this.personnelTelegram.replace('@', '')}`
          : 'https://t.me';
        break;
      default:
        url = `tel:${this.fullNumber()}`;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && (contact === 'PHONE' || contact === 'SMS' || contact === 'WHATSAPP')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  getContactIcon(): string {
    switch (this.preferredContact) {
      case 'EMAIL':
        return 'mail';
      case 'WHATSAPP':
        return 'chat';
      case 'INSTAGRAM':
        return 'photo_camera';
      case 'FACEBOOK':
        return 'thumb_up';
      case 'TELEGRAM':
        return 'send';
      case 'SMS':
        return 'sms';
      default:
        return 'phone';
    }
  }

  getContactTooltip(): string {
    switch (this.preferredContact) {
      case 'EMAIL':
        return 'Contact via Email';
      case 'WHATSAPP':
        return 'Contact via WhatsApp';
      case 'INSTAGRAM':
        return 'Contact via Instagram';
      case 'FACEBOOK':
        return 'Contact via Facebook';
      case 'TELEGRAM':
        return 'Contact via Telegram';
      case 'SMS':
        return 'Send SMS';
      default:
        return 'Call';
    }
  }
}
```

---

## File: frontend/src/app/shared/components/phone-input/phone-input.component.html

Replace with updated version including icons:

```html
<div class="glass-card flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg relative">
  <!-- Call Icon -->
  <span class="material-symbols-outlined text-primary cursor-pointer" (click)="launchContactIntent()" [title]="getContactTooltip()">
    {{ getContactIcon() }}
  </span>

  <!-- Country Selector -->
  <div
    class="flex items-center gap-1 cursor-pointer hover:opacity-80"
    (click)="showDropdown.set(!showDropdown())"
  >
    <span>{{ selectedCountry().flag }}</span>
    <span class="text-white text-sm">{{ selectedCountry().dialCode }}</span>
    <span class="material-symbols-outlined text-silver-400 text-sm">
      arrow_drop_down
    </span>
  </div>

  <!-- Phone Input -->
  <input
    type="tel"
    [ngModel]="phoneNumber()"
    (ngModelChange)="onPhoneChange($event)"
    (blur)="onTouched()"
    class="bg-transparent text-white outline-none flex-1 placeholder-slate-500"
    placeholder="234 567 890"
  />

  <!-- Preferred Contact Icon -->
  <span
    class="material-symbols-outlined text-silver-400 cursor-pointer hover:text-primary transition-colors"
    (click)="launchContactIntent()"
    [title]="getContactTooltip()"
  >
    {{ getContactIcon() }}
  </span>

  <!-- Personnel Profile Icon -->
  @if (personnelId) {
    <span
      class="material-symbols-outlined text-silver-400 cursor-pointer hover:text-primary transition-colors"
      (click)="navigateToPersonnel()"
      title="View Personnel Profile"
    >
      person
    </span>
  }

  <!-- Dropdown Backdrop -->
  @if (showDropdown()) {
    <div
      class="fixed inset-0 z-40"
      (click)="showDropdown.set(false)"
    ></div>
  }
</div>
```

---

## File: frontend/src/app/i18n/translations.ts

Add these keys to both EN and FR translations:

```typescript
// English additions
'PERSONNEL.SEARCH_ID': 'Enter Personnel ID',
'PERSONNEL.LOAD': 'Load',
'PERSONNEL.PROFILE_PICTURE': 'Profile Picture',
'PERSONNEL.FIRST_NAME': 'First Name',
'PERSONNEL.LAST_NAME': 'Last Name',
'PERSONNEL.PHONE': 'Phone',
'PERSONNEL.EMAIL': 'Email',
'PERSONNEL.PREFERRED_CONTACT': 'Preferred Contact Method',
'PERSONNEL.STATUS': 'Status',
'PERSONNEL.ACTIVE': 'Active',
'PERSONNEL.INACTIVE': 'Inactive',
'PERSONNEL.SAVE': 'Save Changes',
'PERSONNEL.SAVING': 'Saving...',
'PERSONNEL.SEARCH_PROMPT': 'Search for a personnel by ID to view and edit their profile',
'PERSONNEL.PROFILE': 'Personnel Profile',
'PERSONNEL.NAV': 'Personnel',

// French additions
'PERSONNEL.SEARCH_ID': 'Entrez l\'ID du personnel',
'PERSONNEL.LOAD': 'Charger',
'PERSONNEL.PROFILE_PICTURE': 'Photo de profil',
'PERSONNEL.FIRST_NAME': 'Prénom',
'PERSONNEL.LAST_NAME': 'Nom',
'PERSONNEL.PHONE': 'Téléphone',
'PERSONNEL.EMAIL': 'E-mail',
'PERSONNEL.PREFERRED_CONTACT': 'Méthode de contact préférée',
'PERSONNEL.STATUS': 'Statut',
'PERSONNEL.ACTIVE': 'Actif',
'PERSONNEL.INACTIVE': 'Inactif',
'PERSONNEL.SAVE': 'Enregistrer',
'PERSONNEL.SAVING': 'Enregistrement...',
'PERSONNEL.SEARCH_PROMPT': 'Recherchez un personnel par ID pour voir et modifier son profil',
'PERSONNEL.PROFILE': 'Profil du personnel',
'PERSONNEL.NAV': 'Personnel',
```

---

## File: frontend/src/app/shared/components/sidebar/sidebar.component.ts

Add nav item for personnel profile. Find the navItems array and add under personnel section or as new item:

```typescript
{
  label: 'PERSONNEL.NAV',
  icon: 'group',
  route: '/dashboard/personnel/team',
},
```

Note: If sidebar already has personnel items, just ensure the routing links work. The profile page is accessed via `:id` parameter, so it doesn't need a direct nav link - it's accessed through the phone-input component icons.
