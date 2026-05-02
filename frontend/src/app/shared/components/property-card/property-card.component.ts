import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../../../services/announcements.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss'
})
export class PropertyCardComponent {
  @Input() announcement!: Announcement;
  @Input() cardType: 'rental' | 'sale' | 'short-term' = 'rental';
  @Input() label: string = '';
  @Input() duration: string = '';

  isFavorite = false;

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.isFavorite = !this.isFavorite;
  }

  getCardLabel(): string {
    if (this.label) return this.label;
    
    switch (this.cardType) {
      case 'rental':
        return 'Curate de rental';
      case 'sale':
        return 'Property';
      case 'short-term':
        return 'Short-term';
      default:
        return '';
    }
  }

  getDuration(): string {
    if (this.duration) return this.duration;
    
    switch (this.cardType) {
      case 'rental':
        return '30 minutes';
      case 'sale':
        return 'Sale sale';
      case 'short-term':
        return 'Short-stays';
      default:
        return '';
    }
  }

  getButtonText(): string {
    switch (this.cardType) {
      case 'rental':
        return 'Contacter';
      case 'sale':
        return 'Contacter';
      case 'short-term':
        return 'Réserver';
      default:
        return 'Contact';
    }
  }
}
