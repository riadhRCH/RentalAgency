import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThankYouComponent } from './thank-you.component';

describe('ThankYouComponent', () => {
  let component: ThankYouComponent;
  let fixture: ComponentFixture<ThankYouComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThankYouComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThankYouComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display company name', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.innerHTML).toContain('DOGHMANI HOMES & ESTATES');
  });

  it('should have no navbar or footer', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.innerHTML).not.toContain('app-public-navbar');
    expect(compiled.innerHTML).not.toContain('app-public-footer');
  });
});
