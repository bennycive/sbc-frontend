import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialRecordsComponent } from './financial-records.component';

describe('FinancialRecordsComponent', () => {
  let component: FinancialRecordsComponent;
  let fixture: ComponentFixture<FinancialRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
