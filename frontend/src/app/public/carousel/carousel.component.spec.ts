import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselComponent } from './carousel.component';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have carousel items', () => {
    expect(component.items.length).toBeGreaterThan(0);
  });

  it('should display first slide initially', () => {
    expect(component.currentIndex).toBe(0);
  });

  it('should advance to next slide', () => {
    component.nextSlide();
    expect(component.currentIndex).toBe(1);
  });

  it('should loop to first slide from last', () => {
    component.currentIndex = component.items.length - 1;
    component.nextSlide();
    expect(component.currentIndex).toBe(0);
  });

  it('should advance slide on container click', () => {
    component.onContainerClick();
    expect(component.currentIndex).toBe(1);
  });

  it('should restart auto play after click', () => {
    spyOn(component, 'startAutoPlay');
    component.onContainerClick();
    expect(component.startAutoPlay).toHaveBeenCalled();
  });

  it('should start auto play on init', () => {
    spyOn(component, 'startAutoPlay');
    component.ngOnInit();
    expect(component.startAutoPlay).toHaveBeenCalled();
  });

  it('should stop auto play on destroy', () => {
    spyOn(component, 'stopAutoPlay');
    component.ngOnDestroy();
    expect(component.stopAutoPlay).toHaveBeenCalled();
  });
});
