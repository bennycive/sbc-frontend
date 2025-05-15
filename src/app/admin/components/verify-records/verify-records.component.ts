import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verify-records',
  templateUrl: './verify-records.component.html',
  styleUrls: ['./verify-records.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VerifyRecordsComponent implements OnInit {
  role: string = 'hod';

  records: any[] = [];
  filteredRecords: any[] = [];
  record: any = null;


filterOption: string = 'all';
filterType: string = 'day';

  totalRequests = 0;
  verifiedRequests = 0;
  pendingRequests = 0;

  filterDate: string = '';

  ngOnInit() {
    this.fetchRecords();
  }

  fetchRecords() {

    this.records = [
      {
        id: 1,
        student_name: 'John Doe',
        program: 'Computer Science',
        submitted_at: new Date(),
        courses: ['Algorithms', 'Databases', 'Networking'],
        payment_status: 'Paid',
        grades_summary: 'A in all courses',
        hod_verified: true,
        bursar_verified: false,
        exam_officer_verified: false,
        request_type: 'certificate',
        academic_details: 'GPA: 4.0',
        financial_years: {
          2023: 'Paid',
          2024: 'Paid'
        }
      },
      {
        id: 2,
        student_name: 'Jane Smith',
        program: 'Information Technology',
        submitted_at: new Date(),
        courses: ['Web Dev', 'Cybersecurity'],
        payment_status: 'Unpaid',
        grades_summary: 'B average',
        hod_verified: false,
        bursar_verified: false,
        exam_officer_verified: false,
        request_type: 'transcript',
        academic_details: 'GPA: 3.2',
        financial_years: {
          2023: 'Paid',
          2024: 'Unpaid'
        }
      }
    ];

    this.updateSummary();
    this.applyFilter();
  }

  updateSummary() {
    this.totalRequests = this.records.length;
    this.verifiedRequests = this.records.filter(r => r.exam_officer_verified).length;
    this.pendingRequests = this.totalRequests - this.verifiedRequests;
  }

  applyFilter(): void {
    if (!this.filterDate) {
      this.filteredRecords = this.records;
      return;
    }

    const inputDate = new Date(this.filterDate);
    this.filteredRecords = this.records.filter(record => {
      const submitted = new Date(record.submitted_at);
      switch (this.filterType) {
        case 'day':
          return submitted.toDateString() === inputDate.toDateString();
        case 'month':
          return submitted.getMonth() === inputDate.getMonth() &&
                 submitted.getFullYear() === inputDate.getFullYear();
        case 'year':
          return submitted.getFullYear() === inputDate.getFullYear();
        default:
          return true;
      }
    });
  }

  selectRecord(record: any) {
    this.record = record;
  }

  verify(role: string) {
    if (!this.record) return;
    if (role === 'hod') this.record.hod_verified = true;
    if (role === 'bursar') this.record.bursar_verified = true;
    if (role === 'exam_officer') this.record.exam_officer_verified = true;
    this.updateSummary();
  }

  printCertificate() {
    alert(`Printing ${this.record?.request_type}...`);
  }

  overrideVerification() {
    if (this.record) {
      this.record.hod_verified = true;
      this.record.bursar_verified = true;
      this.record.exam_officer_verified = true;
    }
    this.updateSummary();
  }


  generateReport() {
  // Simulate a report generation process
  const count = this.filteredRecords.length;
  const message = `Generated report for ${count} record(s) filtered by ${this.filterType}.`;
  alert(message);


}

}
