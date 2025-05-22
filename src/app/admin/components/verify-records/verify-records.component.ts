import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-verify-records',
  templateUrl: './verify-records.component.html',
  styleUrls: ['./verify-records.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class VerifyRecordsComponent implements OnInit {

  role: string = 'hod';

  records: any[] = [];
  filteredRecords: any[] = [];
  record: any = null;

  filterOption: string = 'all';

  totalRequests = 0;
  verifiedRequests = 0;
  pendingRequests = 0;


  private API_BASE_URL = 'http://localhost:8000/api/';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchRecords();

  }

  fetchRecords() {
    this.records = [];

    const requestsToFetch: any[] = [];


    if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {
      requestsToFetch.push(
        this.http.get<any[]>(`${this.API_BASE_URL}users/transcript-certificate-requests/`)
          .pipe(
            map(data => data.map(item => ({
              ...item,
              id: item.id,
              request_type: item.request_type,
              student_name: item.user_username,
              program: item.user_program,
              submitted_at: new Date(item.submitted_at),
              hod_verified: item.hod_verified,
              bursar_verified: item.bursar_verified,
              exam_officer_verified: item.exam_officer_approved,

            }))),
            catchError(error => {
              console.error('Error fetching transcript/certificate requests:', error);
              return of([]);
            })
          )
      );

      requestsToFetch.push(
        this.http.get<any[]>(`${this.API_BASE_URL}users/provisional-requests/`)
          .pipe(
            map(data => data.map(item => ({
              ...item,
              id: item.id,
              request_type: 'provisional',
              student_name: item.user_username,
              program: item.programme,
              submitted_at: new Date(item.submitted_at),
              hod_verified: item.hod_verified,
              bursar_verified: item.bursar_verified,
              exam_officer_verified: item.exam_officer_approved,

            }))),
            catchError(error => {
              console.error('Error fetching provisional requests:', error);
              return of([]);
            })
          )
      );
    }


    forkJoin(requestsToFetch).subscribe({
      next: (allResponses: any[][]) => {
        allResponses.forEach(responseArray => {
          this.records.push(...responseArray);
        });
        this.updateSummary();
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error fetching combined records:', error);

      }
    });
  }

  updateSummary() {
    this.totalRequests = this.records.length;
    this.verifiedRequests = this.records.filter(r => r.exam_officer_verified).length;
    this.pendingRequests = this.totalRequests - this.verifiedRequests;
  }

  applyFilter(): void {
    if (this.filterOption === 'all') {
      this.filteredRecords = [...this.records];
      return;
    }

    const today = new Date();
    this.filteredRecords = this.records.filter(record => {
      const submitted = new Date(record.submitted_at);
      switch (this.filterOption) {
        case 'day':
          return submitted.toDateString() === today.toDateString();
        case 'month':
          return submitted.getMonth() === today.getMonth() &&
                 submitted.getFullYear() === today.getFullYear();
        case 'year':
          return submitted.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  }

  selectRecord(record: any) {
    this.record = { ...record };


    if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {

      this.http.get<any[]>(`${this.API_BASE_URL}users/academic-records/${this.record.user}/`)
        .pipe(
          catchError(error => {
            console.error('Error fetching academic records:', error);
            this.record.courses = [];
            return of([]);
          })
        )
        .subscribe(courses => {
          this.record.courses = courses;
        });
    }


    if (this.role === 'bursar' || this.role === 'exam_officer' || this.role === 'admin') {

      forkJoin([
        this.http.get<any[]>(`${this.API_BASE_URL}users/payment-records/${this.record.user}/`),
        this.http.get<any[]>(`${this.API_BASE_URL}users/other-payment-records/${this.record.user}/`)
      ]).pipe(
        catchError(error => {
          console.error('Error fetching financial records:', error);
          this.record.financial_records = [];
          this.record.has_pending_dues = true;
          return of([[], []]);
        })
      ).subscribe(([mainPayments, otherPayments]) => {
        const allPayments = [...mainPayments, ...otherPayments];

        let totalPaid = 0;
        let totalDue = 0;
        const financialSummary: any[] = [];


        const paymentsByYear: { [key: string]: { paid: number, due: number } } = {};

        allPayments.forEach(payment => {
          const year = payment.academic_year_name;
          if (!paymentsByYear[year]) {
            paymentsByYear[year] = { paid: 0, due: 0 };
          }
          if (payment.payment) paymentsByYear[year].paid += parseFloat(payment.payment);
          if (payment.fee) paymentsByYear[year].due += parseFloat(payment.fee);
        });

        for (const year in paymentsByYear) {
          financialSummary.push({
            year: year,
            amount_paid: paymentsByYear[year].paid,
            total_due: paymentsByYear[year].due
          });
          totalPaid += paymentsByYear[year].paid;
          totalDue += paymentsByYear[year].due;
        }

        this.record.financial_records = financialSummary;
        this.record.has_pending_dues = totalPaid < totalDue;
      });
    }
  }

 verify(role: string) {
  console.log('Verify function called', role);
  if (!this.record) {
    console.warn('No record selected for verification.');
    return;
  }

  let apiEndpoint = '';
  let payload: any = {};

  if (this.record.request_type === 'provisional') {
    apiEndpoint = `<span class="math-inline">\{this\.API\_BASE\_URL\}users/provisional\-requests/</span>{this.record.id}/`;
  } else {
    apiEndpoint = `<span class="math-inline">\{this\.API\_BASE\_URL\}users/transcript\-certificate\-requests/</span>{this.record.id}/`;
  }

  if (role === 'hod') {
    payload = { hod_verified: true };
  } else if (role === 'bursar') {
    payload = { bursar_verified: true };
  } else if (role === 'exam_officer') {
    payload = { exam_officer_approved: true };
  }

  console.log('API Endpoint:', apiEndpoint);
  console.log('Payload:', payload);

  this.http.patch(apiEndpoint, payload)
    .subscribe({
      next: (response) => {
        console.log(`${role} verification successful:`, response);

      },
      error: (error) => {
        console.error(`${role} verification failed:`, error);
        alert(`Verification failed for ${role}. Check console for details.`);
        if (role === 'hod') this.record.hod_verified = false;
        if (role === 'bursar') this.record.bursar_verified = false;
        if (role === 'exam_officer') this.record.exam_officer_verified = false;
      }
    });
}

  printCertificate() {
    alert(`Initiating generation of ${this.record?.request_type} for ${this.record?.student_name}...`);

  }

  overrideVerification() {
    if (!this.record) return;

    let apiEndpoint = '';
    if (this.record.request_type === 'provisional') {
      apiEndpoint = `${this.API_BASE_URL}users/provisional-requests/${this.record.id}/`;
    } else {
      apiEndpoint = `${this.API_BASE_URL}users/transcript-certificate-requests/${this.record.id}/`;
    }

    const payload = {
      hod_verified: true,
      bursar_verified: true,
      exam_officer_approved: true,
    };

    this.http.patch(apiEndpoint, payload)
      .subscribe({
        next: (response) => {
          console.log('Override verification successful:', response);
          this.record.hod_verified = true;
          this.record.bursar_verified = true;
          this.record.exam_officer_verified = true;
          this.updateSummary();
          this.fetchRecords();
        },
        error: (error) => {
          console.error('Override verification failed:', error);
          alert('Failed to override verification. Please check console for details.');
        }
      });
  }

  generateReport() {
    const count = this.filteredRecords.length;
    alert(`Generated report for ${count} record(s) filtered by ${this.filterOption}.`);

  }
}
