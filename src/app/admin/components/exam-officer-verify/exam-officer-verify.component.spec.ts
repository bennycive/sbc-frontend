import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamOfficerVerifyComponent } from './exam-officer-verify.component';

describe('ExamOfficerVerifyComponent', () => {
  let component: ExamOfficerVerifyComponent;
  let fixture: ComponentFixture<ExamOfficerVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamOfficerVerifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamOfficerVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
