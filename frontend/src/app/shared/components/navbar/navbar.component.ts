import { Component, EventEmitter, Input, Output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { I18nService } from '../../../i18n/i18n.service';
import { Language } from '../../../i18n/translations';
import { NotificationService, Notification } from '../../../services/notification.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  @Input() mobileSidebarOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  authService = inject(AuthService);
  i18n = inject(I18nService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  showNotifications = signal(false);
  unreadCount = signal(0);
  notifications = signal<Notification[]>([]);

  ngOnInit() {
    this.loadUnreadCount();
  }

  setLanguage(language: Language) {
    this.i18n.setLanguage(language);
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.count),
    });
  }

  toggleNotifications() {
    const isOpen = this.showNotifications();
    this.showNotifications.set(!isOpen);
    if (!isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications(1, 10).subscribe({
      next: (res) => this.notifications.set(res.data),
    });
  }

  markAsRead(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount.update(c => Math.max(0, c - 1));
        },
      });
    }
    this.showNotifications.set(false);

    if (notification.link) {
      const url = notification.link;
      const baseUrl = `${window.location.origin}/`;
      if (url.startsWith(baseUrl)) {
        this.router.navigate([url.replace(baseUrl, '').split('?')[0].split('#')[0]]);
      } else {
        window.open(url, '_blank');
      }
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => ({ ...x, isRead: true })));
        this.unreadCount.set(0);
      },
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'TRANSACTION_CREATED': return 'receipt_long';
      case 'TRANSACTION_PAID': return 'payments';
      case 'TRANSACTION_CLOSED': return 'check_circle';
      case 'PROPERTY_PRICE_CHANGED': return 'edit';
      case 'PROPERTY_AVAILABILITY_CHANGED': return 'calendar_month';
      case 'CASHOUT_REQUESTED': return 'account_balance_wallet';
      default: return 'notifications';
    }
  }
}
