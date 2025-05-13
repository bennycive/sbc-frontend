import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialVerificationsComponent } from './financial-verifications.component';

describe('FinancialVerificationsComponent', () => {
  let component: FinancialVerificationsComponent;
  let fixture: ComponentFixture<FinancialVerificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialVerificationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialVerificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
