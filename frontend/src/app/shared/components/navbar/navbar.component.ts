import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { I18nService } from '../../../i18n/i18n.service';
import { Language } from '../../../i18n/translations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Input() sidebarCollapsed = false;
  @Input() mobileSidebarOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  authService = inject(AuthService);
  i18n = inject(I18nService);

  setLanguage(language: Language) {
    this.i18n.setLanguage(language);
  }
}
