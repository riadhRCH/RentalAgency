import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  authService = inject(AuthService);
  router = inject(Router)

  navigateToDashboard() {
    console.log('userAgencies ',this.authService.userAgencies())
    this.router.navigate(['/dashboard/overview'])
  }

}
