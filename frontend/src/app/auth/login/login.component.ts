import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PhoneInputComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  credentials = {
    phone: '',
    password: ''
  };
  error = '';
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading.set(true);
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
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
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
        this.loading.set(false);
      }
    });
  }
}
