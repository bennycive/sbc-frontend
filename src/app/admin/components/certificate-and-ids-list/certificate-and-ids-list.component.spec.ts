import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateAndIdsListComponent } from './certificate-and-ids-list.component';

describe('CertificateAndIdsListComponent', () => {
  let component: CertificateAndIdsListComponent;
  let fixture: ComponentFixture<CertificateAndIdsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateAndIdsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateAndIdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
