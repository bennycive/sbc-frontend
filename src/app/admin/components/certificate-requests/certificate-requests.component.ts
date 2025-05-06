import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['./certificate-requests.component.css']
})
export class CertificateRequestsComponent {
  requestForm: FormGroup;
  selectedCategory: string = '';

  constructor(private fb: FormBuilder) {
    this.requestForm = this.fb.group({
      category: ['', Validators.required],
      reason: ['']
    });
  }

  onCategoryChange(event: Event) {
    const category = (event.target as HTMLSelectElement).value;
    this.selectedCategory = category;

    const newForm: { [key: string]: any } = {
      category: [category, Validators.required],
      reason: [''],
    };

    if (category === 'provisional') {
      Object.assign(newForm, {
        yearOfStudy: ['', Validators.required],
        semester: ['', Validators.required],
        department: ['', Validators.required],
      });
    } else if (category === 'transcript') {
      Object.assign(newForm, {
        registrationNumber: ['', Validators.required],
        graduationYear: ['', Validators.required],
      });
    } else if (category === 'certificate') {
      Object.assign(newForm, {
        fullName: ['', Validators.required],
        indexNumber: ['', Validators.required],
        examSession: ['', Validators.required],
      });
    }

    this.requestForm = this.fb.group(newForm);
  }

  submitRequest() {
    if (this.requestForm.valid) {
      console.log('Submitted request:', this.requestForm.value);
      alert('Your request has been submitted to UDOM Records Office.');
      this.requestForm.reset();
      this.selectedCategory = '';
    } else {
      alert('Please complete the form before submitting.');
    }
  }
}
