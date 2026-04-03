import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PhoneInputComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  data = {
    agencyName: '',
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };
  error = '';
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading.set(true);
    this.error = '';
    this.authService.register(this.data).subscribe({
      next: () => {
        // After successful registration, login the user automatically
        this.authService.login({
          phone: this.data.phone,
          password: this.data.password
        }).subscribe({
          next: () => {
            // After login, we need to check if we can skip agency selection
            this.authService.getMe().subscribe({
              next: (meRes) => {
                if (meRes.agencies && meRes.agencies.length === 1) {
                  this.router.navigate(['/dashboard/overview']);
                } else {
                  this.router.navigate(['/auth/select-agency']);
                }
              },
              error: () => this.router.navigate(['/auth/select-agency'])
            });
          },
          error: () => {
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading.set(false);
      }
    });
  }
}
