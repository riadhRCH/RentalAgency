import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CarouselItem {
  id: number;
  image: string;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent implements OnInit, OnDestroy {
  items: CarouselItem[] = [
    {
      id: 1,
      image: '/assets/caroussel/lion.png',
      title: 'اشخر يا الطليانة'
    },
    {
      id: 2,
      image: '/assets/caroussel/chil-ayounak.png',
      title: 'شيل عيونك عني',
    },
    {
      id: 3,
      image: '/assets/caroussel/a3nnn.png',
      title: 'نمر lion',
      description: 'aaaaa33nnnnnn'
    },
    {
      id: 4,
      image: '/assets/caroussel/bch-netchalou-lkol.png',
      title: 'بش نتشالو لكل',
    }
  ];

  currentIndex = 0;
  autoPlayInterval: any;
  readonly DISPLAY_DURATION = 5000; // 5 seconds

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.DISPLAY_DURATION);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
  }

  onContainerClick() {
    // Stop current auto-play
    this.stopAutoPlay();
    // Advance to next slide
    this.nextSlide();
    // Restart auto-play
    this.startAutoPlay();
  }

  isActive(index: number): boolean {
    return this.currentIndex === index;
  }
}
