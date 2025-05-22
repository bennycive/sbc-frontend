import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['./certificate-requests.component.css']
})
export class CertificateRequestsComponent implements OnInit {
  transcriptCertificateForm: FormGroup;
  provisionalForm: FormGroup;
  selectedRequestType: string = '';
  submittedRequests: any[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.transcriptCertificateForm = this.fb.group({
      requestType: [''],
      numberOfCopies: [null, Validators.required]
    });

    this.provisionalForm = this.fb.group({
      currentAddress: ['', Validators.required],
      emailOrPhone: ['', Validators.required],
      yearOfAdmission: ['', Validators.required],
      yearOfStudy: ['', Validators.required],
      programme: ['', Validators.required],
      semesterRange: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchTranscriptCertificateRequests();
  }

  fetchTranscriptCertificateRequests() {
    const token = localStorage.getItem('access_token');
    const headers = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    this.http.get<any[]>('http://localhost:8000/api/users/transcript-certificate-requests/', headers)
      .subscribe({
        next: (data) => {
          this.submittedRequests = data.map((req: any) => ({
            type: this.mapRequestType(req.request_type),
            copies: req.number_of_copies,
            status: this.mapStatus(req),
            date: new Date(req.submitted_at)
          }));
        },
        error: (err) => {
          console.error('Failed to load transcript requests:', err);
        }
      });
  }

  mapRequestType(type: string): string {
    switch (type) {
      case 'both': return 'Certificate & Transcript';
      case 'certificate': return 'Certificate';
      case 'transcript': return 'Transcript';
      default: return type;
    }
  }

  mapStatus(req: any): string {
    if (req.exam_officer_approved) return 'Approved by Exam Officer';
    if (req.hod_verified) return 'Verified by HOD';
    if (req.bursar_verified) return 'Verified by Bursar';
    return 'Pending Bursar Verification';
  }

  submitTranscriptCertificateRequest() {
    if (!this.transcriptCertificateForm.valid || !this.selectedRequestType) {
      Swal.fire('Incomplete!', 'Please complete the form correctly.', 'warning');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;

    if (!userId) {
      Swal.fire('Error', 'User not found. Please log in again.', 'error');
      return;
    }

    const requestBody = {
      user: userId,
      request_type: this.selectedRequestType,
      number_of_copies: this.transcriptCertificateForm.value.numberOfCopies
    };

    const token = localStorage.getItem('access_token');
    const headers = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    this.http.post('http://localhost:8000/api/users/transcript-certificate-requests/', requestBody, headers)
      .subscribe({
        next: () => {
          this.submittedRequests.push({
            type: this.mapRequestType(this.selectedRequestType),
            copies: requestBody.number_of_copies,
            status: 'Pending Bursar Verification',
            date: new Date()
          });

          Swal.fire('Success', 'Request submitted successfully.', 'success');
          this.transcriptCertificateForm.reset();
          this.selectedRequestType = '';
        },
        error: (err) => {
          console.error('Backend error:', err.error);
          Swal.fire('Error', 'Failed to submit request. Check console for details.', 'error');
        }
      });
  }


  submitProvisionalRequest() {
  if (!this.provisionalForm.valid) {
    Swal.fire('Incomplete!', 'Please complete all provisional request fields.', 'warning');
    return;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  if (!userId) {
    Swal.fire('Error', 'User not found. Please log in again.', 'error');
    return;
  }

  const form = this.provisionalForm.value;

  const requestBody = {
    ...form,
    user: userId  // add user id here
  };

  const token = localStorage.getItem('access_token');
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  this.http.post('http://localhost:8000/api/users/provisional-requests/', requestBody, headers)
    .subscribe({
      next: () => {
        this.submittedRequests.push({
          type: `Provisional Result (${form.semesterRange})`,
          copies: 1,
          status: 'Pending Bursar Verification',
          date: new Date()
        });

        Swal.fire('Success', 'Provisional request submitted.', 'success');
        this.provisionalForm.reset();
        this.selectedRequestType = '';
      },
      error: (err) => {
        console.error('Backend error:', err.error);
        Swal.fire('Error', 'Failed to submit provisional request. Check console for details.', 'error');
      }

    });
    
}


}

