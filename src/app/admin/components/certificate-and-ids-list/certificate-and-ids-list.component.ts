import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Student {
  id: number;
  username: string;
}

interface Certificate {
  id: number;
  student: number;
  certificate_type: string;
  certificate_name: string;
  certificate_file_url?: string;
  uploaded_at?: string;
}

import { PreloaderComponent } from '../preloader/preloader.component';

@Component({
  selector: 'app-certificate-and-ids-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PreloaderComponent],
  templateUrl: './certificate-and-ids-list.component.html',
  styleUrls: ['./certificate-and-ids-list.component.css']
})
export class CertificateAndIdsListComponent implements OnInit {
  certificates: Certificate[] = [];
  students: Student[] = [];
  selectedCertificate: Certificate | null = null;
  mode: 'add' | 'view' | 'edit' | null = null;
  isPanelOpen = false;

  loading: boolean = false;

  certificateTypes = [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'form_4_certificate', label: 'Form 4 Certificate' },
    { value: 'form_6_certificate', label: 'Form 6 Certificate' },
    { value: 'diploma_certificate', label: 'Diploma Certificate' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'nin_id', label: 'NIN ID' }
  ];

  addCertificateForm!: FormGroup;
  editCertificateForm!: FormGroup;

  addPreviewUrl: string | ArrayBuffer | null = null;
  editPreviewUrl: string | ArrayBuffer | null = null;

  uploading = false;
  apiUrl = 'http://127.0.0.1:8000/api/users'; // base API URL

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadCertificates();

    this.addCertificateForm = this.fb.group({
      student: ['', Validators.required],
      certificate_type: ['', Validators.required],
      certificate_name: ['', [Validators.required, Validators.minLength(3)]],
      certificate_file: [null, Validators.required]
    });

    this.editCertificateForm = this.fb.group({
      student: ['', Validators.required],
      certificate_type: ['', Validators.required],
      certificate_name: ['', [Validators.required, Validators.minLength(3)]],
      certificate_file: [null] // optional on edit
    });
  }

  isImageFile(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.endsWith(ext));
  }

  loadStudents() {
    this.loading = true;
    this.http.get<Student[]>(`${this.apiUrl}/users/`).subscribe({
      next: (res) => {
        this.students = res.filter((user: any) => user.role === 'student');
        this.loading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to load students', 'error');
        this.loading = false;
      }
    });

  }

  loadCertificates() {
    this.loading = true;
    this.http.get<Certificate[]>(`${this.apiUrl}/certificates/`).subscribe({
      next: (res) => {
        this.certificates = res;
        this.loading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to load certificates', 'error');
        this.loading = false;
      }
    });
  }

  openAddPanel() {
    this.mode = 'add';
    this.addCertificateForm.reset();
    this.addPreviewUrl = null;
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
      student: cert.student,
      certificate_type: cert.certificate_type,
      certificate_name: cert.certificate_name
    });
    this.editPreviewUrl = cert.certificate_file_url || null;
    this.isPanelOpen = true;
  }

  closePanel() {
    this.isPanelOpen = false;
    this.mode = null;
    this.selectedCertificate = null;
    this.addPreviewUrl = null;
    this.editPreviewUrl = null;
  }

  handleAddFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.addCertificateForm.patchValue({ certificate_file: file });
      const reader = new FileReader();
      reader.onload = () => (this.addPreviewUrl = reader.result);
      reader.readAsDataURL(file);
    }
  }

  handleEditFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.editCertificateForm.patchValue({ certificate_file: file });
      const reader = new FileReader();
      reader.onload = () => (this.editPreviewUrl = reader.result);
      reader.readAsDataURL(file);
    }
  }

  submitAddCertificate() {
    if (this.addCertificateForm.invalid) {
      this.addCertificateForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('student', this.addCertificateForm.value.student);
    formData.append('certificate_type', this.addCertificateForm.value.certificate_type);
    formData.append('certificate_name', this.addCertificateForm.value.certificate_name);
    formData.append('certificate_file', this.addCertificateForm.value.certificate_file);

    this.uploading = true;

    this.http.post<Certificate>(`${this.apiUrl}/certificates/`, formData).subscribe({
      next: (res) => {
        this.loadCertificates();
        this.closePanel();
        Swal.fire('Success', 'Certificate added successfully', 'success');
        this.uploading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to add certificate', 'error');
        this.uploading = false;
      }
    });
  }

  submitEditCertificate() {
    if (!this.selectedCertificate || this.editCertificateForm.invalid) {
      this.editCertificateForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('student', this.editCertificateForm.value.student);
    formData.append('certificate_type', this.editCertificateForm.value.certificate_type);
    formData.append('certificate_name', this.editCertificateForm.value.certificate_name);

    const file = this.editCertificateForm.value.certificate_file;
    if (file) {
      formData.append('certificate_file', file);
    }

    this.uploading = true;

    this.http.put<Certificate>(`${this.apiUrl}/certificates/${this.selectedCertificate.id}/`, formData).subscribe({
      next: (updatedCert) => {
        this.loadCertificates();
        this.closePanel();
        Swal.fire('Success', 'Certificate updated successfully', 'success');
        this.uploading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to update certificate', 'error');
        this.uploading = false;
      }
    });
  }

  deleteCertificate(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/certificates/${id}/`).subscribe({
          next: () => {
            this.certificates = this.certificates.filter(c => c.id !== id);
            Swal.fire('Deleted!', 'Certificate has been deleted.', 'success');
          },
          error: () => Swal.fire('Error', 'Failed to delete certificate', 'error')
        });
      }
    });

  }

  getStudentName(id: number) {
    const student = this.students.find(s => s.id === id);
    return student ? student.username : 'Unknown';
  }
}
