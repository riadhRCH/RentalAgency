import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Agency } from '../auth.service';

@Component({
  selector: 'app-agency-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agency-selection.component.html',
  styleUrls: ['./agency-selection.component.scss']
})
export class AgencySelectionComponent implements OnInit {
  agencies = computed(() => this.authService.userAgencies());

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.agencies().length === 0) {
      this.authService.getMe().subscribe();
    }
  }

  onSelect(agency: Agency) {
    this.authService.setActiveAgency(agency.id);
    this.router.navigate(['/']);
  }
}
