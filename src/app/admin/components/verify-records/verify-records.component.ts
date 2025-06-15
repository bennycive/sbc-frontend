import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';


interface Certificate {
  id: number;
  user: number;
  certificate_type: string;
  file_url: string;
  issued_date: string;
  name?: string;
  displayName?: string;
}


interface StudentProfile {
  id: number;
  user: number;
  registration_number?: string;
  phone_number?: string;
}

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
  startDate: string | null = null;
  endDate: string | null = null;

  totalRequests = 0;
  verifiedRequests = 0;
  pendingRequests = 0;
  certificatesRequestedPerYear: { year: number, count: number }[] = [];

  private API_BASE_URL = 'http://localhost:8000/api/users/';
  private COLLEGES_API_BASE_URL = 'http://localhost:8000/api/colleges/';


  private apiEndpoints = {
    users: `${this.API_BASE_URL}users/`,
    profiles: `${this.API_BASE_URL}profiles/`,
    academicYears: `${this.API_BASE_URL}academic-years/`,
    paymentRecords: `${this.API_BASE_URL}payment-records/`,
    otherPaymentRecords: `${this.API_BASE_URL}other-payment-records/`,
    transcriptCertificateRequests: `${this.API_BASE_URL}transcript-certificate-requests/`,
    provisionalRequests: `${this.API_BASE_URL}provisional-requests/`,
    certificates: `${this.API_BASE_URL}certificates/`,
    academicRecords: `${this.API_BASE_URL}academic-records/`,
    colleges: `${this.COLLEGES_API_BASE_URL}colleges/`,
    departments: `${this.COLLEGES_API_BASE_URL}departments/`,
    departmentCourses: `${this.COLLEGES_API_BASE_URL}department/courses/`,
  };


  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.role = localStorage.getItem('userRole') || 'hod';
    this.fetchRecords();
  }


  /**
 * Handles verification for HOD, Bursar, and Exam Officer roles.
 * Constructs the appropriate API request and payload based on the role.
 */

  verify(verificationRole: string) {
    if (!this.record) {
      this.showSwal('error', 'No record selected for verification.');
      return;
    }


    const roleVerificationFlag: keyof any = `${verificationRole}_verified`;
    if (this.record[roleVerificationFlag]) {
      this.showSwal('info', `Record already verified by ${verificationRole.replace('_', ' ')}.`);
      return;
    }


    // Workflow dependency checks
    if (verificationRole === 'bursar' && !this.record.hod_verified) {
      this.showSwal('warning', 'HOD must verify the record first.');
      return;
    }
    if (verificationRole === 'exam_officer' && (!this.record.hod_verified || !this.record.bursar_verified)) {
      this.showSwal('warning', 'HOD and Bursar must verify the record first.');
      return;
    }

    let apiEndpoint = '';
    if (this.record.request_type === 'provisional') {
      apiEndpoint = `${this.apiEndpoints.provisionalRequests}${this.record.id}/`;
    } else {
      apiEndpoint = `${this.apiEndpoints.transcriptCertificateRequests}${this.record.id}/`;
    }

    const payload = { [roleVerificationFlag]: true };
    const roleName = verificationRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    this.http.patch(apiEndpoint, payload).subscribe({
      next: (response: any) => {
        this.showSwal('success', `${roleName} verification successful.`, 2000);

        // Update local record state
        this.record[roleVerificationFlag] = true;
        const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
        if (index > -1) {
          this.records[index][roleVerificationFlag] = true;
        }

        this.applyFilter();
        this.updateSummary();
      },
      error: (error) => {
        console.error(`${roleName} verification failed:`, error);
        this.showSwal('error', `Failed to verify record. Error: ${error.message || 'Server error'}.`);
      }
    });
  }

  fetchRecords() {
    this.records = [];
    const requestsToFetch: any[] = [];

    const mapItemToRecord = (item: any, requestTypeOverride?: string) => {
      const user = item.user || {};
      let studentName = 'N/A';
      if (user.first_name || user.last_name) {
        studentName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      } else if (item.user_first_name || item.user_last_name) {
        studentName = `${item.user_first_name || ''} ${item.user_last_name || ''}`.trim();
      } else if (user.username) {
        studentName = user.username;
      } else if (item.user_username) {
        studentName = item.user_username;
      }

      let program = item.programme || item.user_program || user.program || user.department || 'N/A';
      if (requestTypeOverride === 'provisional' && item.programme) {
        program = item.programme;
      }

      return {
        ...item,
        id: item.id,
        request_type: requestTypeOverride || item.request_type,
        student_name: studentName,
        program: program,
        submitted_at: this.isValidDate(item.submitted_at) ? new Date(item.submitted_at) : new Date(0),
        hod_verified: item.hod_verified,
        bursar_verified: item.bursar_verified,
        exam_officer_approved: item.exam_officer_approved,
        user_id: user.id || item.user
      };
    };

    const transcriptRequests = this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
      .pipe(map(data => data.map(item => mapItemToRecord(item))), catchError(() => of([])));

    const provisionalRequests = this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
      .pipe(map(data => data.map(item => mapItemToRecord(item, 'provisional'))), catchError(() => of([])));

    requestsToFetch.push(transcriptRequests, provisionalRequests);

    forkJoin(requestsToFetch).subscribe({
      next: (allResponses: any[][]) => {
        this.records = allResponses.flat();
        this.records = this.records.filter((record, index, self) =>
          index === self.findIndex((r) => (r.id === record.id && r.request_type === record.request_type))
        );
        this.updateSummary();
        this.calculateCertificatesRequestedPerYear();
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error fetching combined records:', error);
      }
    });
  }

  updateSummary() {
    this.totalRequests = this.records.length;
    let verifiedCount = 0;
    if (this.role === 'hod') {
      verifiedCount = this.records.filter(r => r.hod_verified).length;
    } else if (this.role === 'bursar') {
      verifiedCount = this.records.filter(r => r.bursar_verified).length;
    } else if (this.role === 'exam_officer') {
      verifiedCount = this.records.filter(r => r.exam_officer_approved).length;
    } else { // admin
      verifiedCount = this.records.filter(r => this.isRequestComplete(r)).length;
    }
    this.verifiedRequests = verifiedCount;
    this.pendingRequests = this.totalRequests - this.verifiedRequests;
  }

  calculateCertificatesRequestedPerYear() {
    const yearCounts: { [year: number]: number } = {};
    this.records.forEach(record => {
      const year = new Date(record.submitted_at).getFullYear();
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    this.certificatesRequestedPerYear = Object.keys(yearCounts)
      .map(year => ({ year: Number(year), count: yearCounts[Number(year)] }))
      .sort((a, b) => a.year - b.year);
  }

  applyFilter(): void {
    let tempFilteredRecords = [...this.records];
    if (this.filterOption !== 'all') {
      const today = new Date();
      tempFilteredRecords = tempFilteredRecords.filter(record => {
        const submitted = new Date(record.submitted_at);
        switch (this.filterOption) {
          case 'day': return submitted.toDateString() === today.toDateString();
          case 'month': return submitted.getMonth() === today.getMonth() && submitted.getFullYear() === today.getFullYear();
          case 'year': return submitted.getFullYear() === today.getFullYear();
          default: return true;
        }
      });
    }
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      tempFilteredRecords = tempFilteredRecords.filter(record => {
        const submitted = new Date(record.submitted_at);
        return submitted >= start && submitted <= end;
      });
    }
    this.filteredRecords = tempFilteredRecords;
  }

  resetDateFilters() {
    this.startDate = null;
    this.endDate = null;
    this.filterOption = 'all';
    this.applyFilter();
  }

  selectRecord(selectedRequest: any) {
    this.record = {
      ...selectedRequest,
      studentDetails: { name: selectedRequest.student_name, program: selectedRequest.program, request_type: selectedRequest.request_type, submitted_at: selectedRequest.submitted_at },
      academicRecords: [],
      financialRecords: { details: [], has_pending_dues: false, total_paid: 0, total_due: 0 },
      certificates: [],
      fullProfile: null
    };
    const studentUserId = selectedRequest.user_id || selectedRequest.user;
    if (!studentUserId) {
      console.error("Student User ID not found in the selected record.", selectedRequest);
      this.showSwal('error', "Cannot fetch details: Student User ID is missing.");
      this.record = null;
      return;
    }
    const dataObservables: any = {};
    dataObservables.profile = this.http.get<StudentProfile[]>(`${this.apiEndpoints.profiles}?user=${studentUserId}`).pipe(map(p => p.length > 0 ? p[0] : null), catchError(() => of(null)));
    if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.academic = this.http.get<any[]>(`${this.apiEndpoints.academicRecords}?user=${studentUserId}`).pipe(catchError(() => of([])));
    }
    if (this.role === 'bursar' || this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.financial = forkJoin([
        this.http.get<any[]>(`${this.apiEndpoints.paymentRecords}?user=${studentUserId}`).pipe(catchError(() => of([]))),
        this.http.get<any[]>(`${this.apiEndpoints.otherPaymentRecords}?user=${studentUserId}`).pipe(catchError(() => of([])))
      ]).pipe(map(([main, other]) => this.processFinancialData(main, other)), catchError(() => of({ details: [], has_pending_dues: true, total_paid: 0, total_due: 0 })));
    }
    if (this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.certificates = this.http.get<Certificate[]>(`${this.apiEndpoints.certificates}?user=${studentUserId}`).pipe(map(certs => certs.map(c => ({ ...c, displayName: this.generateCertificateDisplayName(c) }))), catchError(() => of([])));
    }

    if (Object.keys(dataObservables).length === 0) return;

    forkJoin(dataObservables).subscribe((results: any) => {
      if (results.profile) this.record.fullProfile = results.profile;
      if (results.academic) this.record.academicRecords = results.academic;
      if (results.financial) this.record.financialRecords = results.financial;
      if (results.certificates) this.record.certificates = results.certificates;
    });
  }

  processFinancialData(mainPayments: any[], otherPayments: any[]) {
    const allPayments = [...mainPayments, ...otherPayments];
    let totalPaid = 0;
    let totalDue = 0;
    const paymentsByYear: { [key: string]: { paid: number, due: number } } = {};
    allPayments.forEach(p => {
      const year = p.academic_year_name || 'N/A';
      if (!paymentsByYear[year]) paymentsByYear[year] = { paid: 0, due: 0 };
      if (p.payment) paymentsByYear[year].paid += parseFloat(p.payment);
      if (p.fee) paymentsByYear[year].due += parseFloat(p.fee);
    });
    const financialSummary = Object.keys(paymentsByYear).map(year => ({ year, amount_paid: paymentsByYear[year].paid, total_due: paymentsByYear[year].due }));
    financialSummary.forEach(s => { totalPaid += s.amount_paid; totalDue += s.total_due; });
    return { details: financialSummary, has_pending_dues: totalPaid < totalDue, total_paid: totalPaid, total_due: totalDue };
  }

  generateCertificateDisplayName(certificate: Certificate): string {
    const baseName = certificate.name && certificate.name.trim() !== '' && !certificate.name.includes('/') ?
      certificate.name : certificate.certificate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return baseName;
  }

  isValidDate(dateString: any): boolean {
    return dateString && !isNaN(new Date(dateString).getTime());
  }

  printCertificate() {
    if (!this.record) {
      this.showSwal('error', "No record selected.");
      return;
    }
    if (!this.record.exam_officer_approved) {
      this.showSwal('warning', "Certificate/Transcript can only be generated after final verification by the Exam Officer.");
      return;
    }
    const { request_type } = this.record.studentDetails;
    let downloadUrl = '';
    if (request_type === 'transcript') {
      downloadUrl = `http://localhost:8000/api/generate-transcript/?request_id=${this.record.id}&user_id=${this.record.user_id}`;
    } else if (request_type === 'provisional') {
      downloadUrl = `http://localhost:8000/api/generate-certificate/?request_id=${this.record.id}&user_id=${this.record.user_id}&type=${request_type}`;
    } else {
      this.showSwal('error', "Unsupported request type for generation.");
      return;
    }
    window.open(downloadUrl, '_blank');
  }

  /**
   * CORRECTED: Sends `exam_officer_approved` instead of `exam_officer_approved`.
   */
  overrideVerification() {
    if (!this.record || !this.record.id) {
      this.showSwal('error', "No record selected for override.");
      return;
    }
    let apiEndpoint = '';
    if (this.record.request_type === 'provisional') {
      apiEndpoint = `${this.apiEndpoints.provisionalRequests}${this.record.id}/`;
    } else {
      apiEndpoint = `${this.apiEndpoints.transcriptCertificateRequests}${this.record.id}/`;
    }
    const payload = {
      hod_verified: true,
      bursar_verified: true,
      exam_officer_approved: true, // <<< CORRECTED KEY
    };
    this.http.patch(apiEndpoint, payload).subscribe({
      next: (response: any) => {
        this.showSwal('success', 'Override successful! All steps verified.');
        this.record.hod_verified = true;
        this.record.bursar_verified = true;
        this.record.exam_officer_approved = true;
        const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
        if (index > -1) {
          Object.assign(this.records[index], payload);
        }
        this.applyFilter();
        this.updateSummary();
      },
      error: (error) => {
        console.error('Override verification failed:', error);
        this.showSwal('error', `Failed to override verification. Error: ${error.message || 'Server error'}.`);
      }
    });
  }

  getRequestStatus(record: any): { text: string; class: string } {
    if (record.hod_verified && record.bursar_verified && record.exam_officer_approved) {
      return { text: 'Complete', class: 'bg-success' };
    }
    if (record.hod_verified && record.bursar_verified) {
      return { text: 'Pending Exam Officer', class: 'bg-info text-dark' };
    }
    if (record.hod_verified) {
      return { text: 'Pending Bursar', class: 'bg-primary' };
    }
    return { text: 'Pending HOD', class: 'bg-warning text-dark' };

  }

  isRequestComplete(record: any): boolean {
    return record.hod_verified && record.bursar_verified && record.exam_officer_approved;
  }

  private showSwal(icon: 'success' | 'error' | 'warning' | 'info', title: string, timer?: number) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        icon: icon,
        title: title,
        timer: timer,
        showConfirmButton: !timer
      });
    });
  }
}
