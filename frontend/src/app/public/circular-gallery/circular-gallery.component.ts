import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  AfterViewInit,
  NgZone,
  ElementRef,
  ViewChild,
} from '@angular/core';
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
export class CircularGalleryComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() items: CircularGalleryItem[] = [];
  @Input() autoRotateSpeed = 0.15;

  // Read by opacityFor() in the template — not used for transform (DOM-direct)
  rotation = 0;

  @ViewChild('rotationRef', { static: true })
  private rotationRef!: ElementRef<HTMLDivElement>;

  @ViewChild('shellRef', { static: true })
  private shellRef!: ElementRef<HTMLDivElement>;

  private animationFrameId: number | null = null;
  private interactionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isUserInteracting = false;

  // ── Drag / swipe state ───────────────────────────────────────
  private isDragging = false;
  private dragStartX = 0;
  private dragStartRotation = 0;
  private lastDragX = 0;
  private dragVelocity = 0;

  private readonly scrollHandler      = this.onScroll.bind(this);
  private readonly pointerDownHandler = this.onPointerDown.bind(this);
  private readonly pointerMoveHandler = this.onPointerMove.bind(this);
  private readonly pointerUpHandler   = this.onPointerUp.bind(this);
  private readonly resizeHandler      = this.onResize.bind(this);

  constructor(private ngZone: NgZone) {}

  // ────────────────────────────────────────────────────────────
  // Computed geometry
  // All values react to window.innerWidth so they're always current.
  // ────────────────────────────────────────────────────────────

  /** Card width in px — shrinks on narrow viewports. */
  get cardWidth(): number {
    if (typeof window === 'undefined') return 240;
    const vw = window.innerWidth;
    if (vw < 480) return Math.round(Math.min(170, vw * 0.44));
    if (vw < 768) return Math.round(Math.min(210, vw * 0.40));
    return 280;
  }

  /** Maintains a 1 : 1.36 (≈ 4:5.5) aspect ratio. */
  get cardHeight(): number {
    return Math.round(this.cardWidth * 1.36);
  }

  /**
   * Effective translateZ radius in px.
   *
   * For few items (≤ 5) the naive 360/n spacing leaves huge gaps.
   * Instead, compute the minimum radius so adjacent cards are at
   * least `gap` px apart:
   *
   *   radius = (cardWidth + gap) / (2 × sin(π / n))
   *
   * then clamp it to the responsive maximum so cards never overflow
   * the viewport on mobile.
   */
  get effectiveRadius(): number {
    const n = this.items.length;
    if (n === 0) return 0;

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const maxRadius = vw < 480 ? 210 : vw < 768 ? 300 : 520;

    if (n <= 5) {
      const gap = 28; // minimum visible gap between card edges
      const computed = (this.cardWidth + gap) / (2 * Math.sin(Math.PI / n));
      return Math.min(computed, maxRadius);
    }

    return maxRadius;
  }

  // ────────────────────────────────────────────────────────────
  ngOnInit() {
    if (typeof window === 'undefined') return;

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    const shell = this.shellRef.nativeElement;
    shell.addEventListener('pointerdown', this.pointerDownHandler);
    window.addEventListener('pointermove',    this.pointerMoveHandler);
    window.addEventListener('pointerup',      this.pointerUpHandler);
    window.addEventListener('pointercancel',  this.pointerUpHandler);

    this.ngZone.runOutsideAngular(() => this.startAnimation());
  }

  ngAfterViewInit() {
    // Set shell height from computed card dimensions on first render
    this.updateShellHeight();
  }

  ngOnDestroy() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('scroll',       this.scrollHandler);
    window.removeEventListener('resize',       this.resizeHandler);
    window.removeEventListener('pointermove',  this.pointerMoveHandler);
    window.removeEventListener('pointerup',    this.pointerUpHandler);
    window.removeEventListener('pointercancel', this.pointerUpHandler);

    this.shellRef?.nativeElement
      .removeEventListener('pointerdown', this.pointerDownHandler);

    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    if (this.interactionTimeout !== null) clearTimeout(this.interactionTimeout);
  }

  // ── Auto-rotate ──────────────────────────────────────────────
  startAnimation() {
    const animate = () => {
      if (!this.isUserInteracting && !this.isDragging) {
        this.rotation += this.autoRotateSpeed;
        this.applyTransform();
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  // ── Scroll → rotate ──────────────────────────────────────────
  private onScroll(): void {
    const el = this.shellRef?.nativeElement;
    if (!el) return;

    const rect      = el.getBoundingClientRect();
    const sectionH  = el.offsetHeight;
    const viewportH = window.innerHeight;
    const progress  = Math.max(0, Math.min(1,
      (-rect.top + viewportH) / (sectionH + viewportH)
    ));

    this.markInteracting();
    this.rotation = progress * 360;
    this.applyTransform();
  }

  // ── Resize ───────────────────────────────────────────────────
  private onResize(): void {
    this.updateShellHeight();
  }

  // ── Drag / swipe ─────────────────────────────────────────────
  private onPointerDown(e: PointerEvent): void {
    this.isDragging        = true;
    this.dragStartX        = e.clientX;
    this.dragStartRotation = this.rotation;
    this.lastDragX         = e.clientX;
    this.dragVelocity      = 0;
    this.markInteracting();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const delta       = e.clientX - this.dragStartX;
    this.dragVelocity = e.clientX - this.lastDragX;
    this.lastDragX    = e.clientX;
    this.rotation     = this.dragStartRotation + delta * 0.25;
    this.applyTransform();
  }

  private onPointerUp(_e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.applyInertia(this.dragVelocity * 0.25);
  }

  private applyInertia(initialVelocity: number): void {
    if (Math.abs(initialVelocity) < 0.01) return;
    const decay = 0.93;
    let vel = initialVelocity;
    const step = () => {
      if (this.isDragging) return;
      vel *= decay;
      this.rotation += vel;
      this.applyTransform();
      if (Math.abs(vel) > 0.05) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ── DOM helpers ──────────────────────────────────────────────
  private applyTransform(): void {
    if (this.rotationRef?.nativeElement) {
      this.rotationRef.nativeElement.style.transform =
        `rotateY(${this.rotation}deg)`;
    }
  }

  /**
   * Drives shell height from JS so it always fits the responsive card
   * height without needing hardcoded px values in SCSS.
   */
  private updateShellHeight(): void {
    const shell = this.shellRef?.nativeElement;
    if (!shell) return;
    shell.style.height = `${this.cardHeight + 80}px`;
  }

  private markInteracting(): void {
    this.isUserInteracting = true;
    if (this.interactionTimeout !== null) clearTimeout(this.interactionTimeout);
    this.interactionTimeout = setTimeout(() => {
      this.isUserInteracting = false;
    }, 1500);
  }

  // ── Template helpers ─────────────────────────────────────────
  angleFor(index: number): number {
    return this.items.length ? (360 / this.items.length) * index : 0;
  }

  opacityFor(index: number): number {
    const itemAngle       = this.angleFor(index);
    const totalRotation   = ((this.rotation % 360) + 360) % 360;
    const relativeAngle   = (itemAngle + totalRotation + 360) % 360;
    const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
    return Math.max(0.3, 1 - normalizedAngle / 180);
  }
}