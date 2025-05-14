import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyRecordsComponent } from './verify-records.component';

describe('VerifyRecordsComponent', () => {
  let component: VerifyRecordsComponent;
  let fixture: ComponentFixture<VerifyRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
