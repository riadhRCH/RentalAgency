import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CircularGalleryItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition?: string;
}

@Component({
  selector: 'app-circular-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './circular-gallery.component.html',
  styleUrl: './circular-gallery.component.scss',
})
export class CircularGalleryComponent implements OnInit, OnDestroy {
  @Input() items: CircularGalleryItem[] = [];
  @Input() radius = 520;
  @Input() autoRotateSpeed = 0.02;

  rotation = 0;
  isScrolling = false;

  private animationFrameId: number | null = null;
  private scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly onScroll = () => {
    this.isScrolling = true;
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    this.rotation = progress * 360;

    this.scrollTimeoutId = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  };

  ngOnInit() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.startAnimation();
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }
  }

  startAnimation() {
    const animate = () => {
      if (!this.isScrolling) {
        this.rotation += this.autoRotateSpeed;
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  angleFor(index: number) {
    return this.items.length ? (360 / this.items.length) * index : 0;
  }

  opacityFor(index: number) {
    const itemAngle = this.angleFor(index);
    const totalRotation = ((this.rotation % 360) + 360) % 360;
    const relativeAngle = (itemAngle + totalRotation + 360) % 360;
    const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
    return Math.max(0.3, 1 - normalizedAngle / 180);
  }
}
