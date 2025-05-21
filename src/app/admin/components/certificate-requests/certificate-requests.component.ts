import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['./certificate-requests.component.css']
})
export class CertificateRequestsComponent {
  transcriptCertificateForm: FormGroup;
  provisionalForm: FormGroup;
  selectedRequestType: string = '';
  submittedRequests: any[] = [];

  constructor(private fb: FormBuilder) {
    this.transcriptCertificateForm = this.fb.group({
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

  // Handle form selector change
  onRequestTypeChange(type: string) {
    this.selectedRequestType = type;
    // Reset forms when switching type
    this.transcriptCertificateForm.reset();
    this.provisionalForm.reset();
  }

  submitTranscriptCertificateRequest() {
    if (!this.transcriptCertificateForm.valid || !this.selectedRequestType) {
      Swal.fire('Incomplete!', 'Please complete the form correctly.', 'warning');
      return;
    }

    const labelMap: any = {
      both: 'Certificate & Transcript',
      certificateOnly: 'Certificate Only',
      transcriptOnly: 'Transcript Only'
    };

    this.submittedRequests.push({
      type: labelMap[this.selectedRequestType],
      copies: this.transcriptCertificateForm.value.numberOfCopies,
      status: 'Pending Bursar Verification',
      date: new Date()
    });

    Swal.fire('Success', 'Request submitted successfully.', 'success');
    this.transcriptCertificateForm.reset();
    this.selectedRequestType = '';
  }

  submitProvisionalRequest() {
    if (!this.provisionalForm.valid) {
      Swal.fire('Incomplete!', 'Please complete all provisional request fields.', 'warning');
      return;
    }

    const form = this.provisionalForm.value;

    this.submittedRequests.push({
      type: `Provisional Result (${form.semesterRange})`,
      copies: 1,
      status: 'Pending Bursar Verification',
      date: new Date()
    });

    Swal.fire('Success', 'Provisional request submitted.', 'success');
    this.provisionalForm.reset();
    this.selectedRequestType = '';
  }
}
