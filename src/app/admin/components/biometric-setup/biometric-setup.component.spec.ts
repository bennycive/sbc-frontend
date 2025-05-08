import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiometricSetupComponent } from './biometric-setup.component';

describe('BiometricSetupComponent', () => {
  let component: BiometricSetupComponent;
  let fixture: ComponentFixture<BiometricSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiometricSetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiometricSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
