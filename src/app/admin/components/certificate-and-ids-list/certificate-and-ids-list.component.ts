// certificate-and-ids-list.component.ts (standalone)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Certificate {
  id: number;
  type: string;
  name: string;
  imageUrl?: string;
  reason?: string;
}

@Component({
  selector: 'app-certificate-and-ids-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './certificate-and-ids-list.component.html',
  styleUrls: ['./certificate-and-ids-list.component.css']
})
export class CertificateAndIdsListComponent implements OnInit {
  certificates: Certificate[] = [];
  selectedCertificate: Certificate | null = null;
  mode: 'add' | 'view' | 'edit' | null = null;
  isPanelOpen = false;

  addCertificateForm!: FormGroup;
  editCertificateForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.addCertificateForm = this.fb.group({
      category: ['', Validators.required],
      name: ['', Validators.required],
      image: [null]
    });

    this.editCertificateForm = this.fb.group({
      category: ['', Validators.required],
      name: ['', Validators.required],
      image: [null]
    });

    this.certificates = [
      { id: 1, type: 'NIN', name: 'National ID', imageUrl: '/assets/nin.jpg' },
      { id: 2, type: 'Vote ID', name: 'Voter Card', imageUrl: '/assets/vote.jpg' }
    ];
  }

  openAddPanel() {
    this.mode = 'add';
    this.addCertificateForm.reset();
    this.isPanelOpen = true;
  }

  openViewPanel(cert: Certificate) {
    this.selectedCertificate = cert;
    this.mode = 'view';
    this.isPanelOpen = true;
  }

  openEditPanel(cert: Certificate) {
    this.selectedCertificate = cert;
    this.mode = 'edit';
    this.editCertificateForm.patchValue({
      category: cert.type,
      name: cert.name
    });
    this.isPanelOpen = true;
  }

  closePanel() {
    this.isPanelOpen = false;
    this.mode = null;
    this.selectedCertificate = null;
  }

  submitAddCertificate() {
    if (this.addCertificateForm.valid) {
      const formValue = this.addCertificateForm.value;
      const newId = this.certificates.length + 1;
      this.certificates.push({
        id: newId,
        type: formValue.category,
        name: formValue.name
      });
      this.closePanel();
    }
  }

  submitEditCertificate() {
    if (this.editCertificateForm.valid && this.selectedCertificate) {
      const formValue = this.editCertificateForm.value;
      Object.assign(this.selectedCertificate, {
        type: formValue.category,
        name: formValue.name
      });
      this.closePanel();
    }
  }

  deleteCertificate(id: number) {
    this.certificates = this.certificates.filter(c => c.id !== id);
  }
}
