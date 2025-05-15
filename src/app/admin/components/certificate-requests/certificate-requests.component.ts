import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['./certificate-requests.component.css']
})
export class CertificateRequestsComponent {
  transcriptCertificateForm: FormGroup;
  provisionalForm: FormGroup;
  submittedRequests: any[] = [];

  constructor(private fb: FormBuilder) {
    this.transcriptCertificateForm = this.fb.group({
      both: [false],
      certificateOnly: [false],
      transcriptOnly: [false],
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

  submitTranscriptCertificateRequest() {
    const form = this.transcriptCertificateForm.value;

    if (!this.transcriptCertificateForm.valid ||
        (!form.both && !form.certificateOnly && !form.transcriptOnly)) {
      Swal.fire('Incomplete!', 'Please complete the transcript/certificate form correctly.', 'warning');
      return;
    }

    if (form.both) {
      this.submittedRequests.push({
        type: 'Certificate & Transcript',
        copies: form.numberOfCopies,
        status: 'Pending Bursar Verification',
        date: new Date()
      });
    }

    if (form.certificateOnly) {
      this.submittedRequests.push({
        type: 'Certificate Only',
        copies: form.numberOfCopies,
        status: 'Pending Bursar Verification',
        date: new Date()
      });
    }

    if (form.transcriptOnly) {
      this.submittedRequests.push({
        type: 'Transcript Only',
        copies: form.numberOfCopies,
        status: 'Pending Bursar Verification',
        date: new Date()
      });
    }

    Swal.fire('Success', 'Request submitted successfully.', 'success');
    this.transcriptCertificateForm.reset();
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
  }

}

