import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersPageComponent } from './owners-page.component';

describe('OwnersPageComponent', () => {
  let component: OwnersPageComponent;
  let fixture: ComponentFixture<OwnersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnersPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});