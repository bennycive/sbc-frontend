import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

interface Certificate {
  id: number;
  user: number;
  certificate_type: string; // e.g., 'transcript', 'provisional', 'degree'
  file_url: string; // URL to the certificate file
  issued_date: string; // EXPECTS VALID DATE STRING FROM API
  name?: string; // Optional: original name from backend (e.g., filename)
  displayName?: string; // Optional: Formatted name for UI display
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

  verify(verificationRole: string) {
    if (verificationRole !== 'hod') {
      console.warn(`Verification for role '${verificationRole}' is disabled.`);
      return;
    }
    // Implement HOD verification logic here
    if (!this.record) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'error',
          title: 'Error',
          text: 'No record selected for verification.',
        });
      });
      return;
    }
    if (this.record.hod_verified) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'info',
          title: 'Info',
          text: 'Record already verified by HOD.',
        });
      });
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
    };
    this.http.patch(apiEndpoint, payload).subscribe({
      next: (response: any) => {
        import('sweetalert2').then(Swal => {
          Swal.default.fire({
            icon: 'success',
            title: 'Success',
            text: 'HOD verification successful.',
            timer: 2000,
            showConfirmButton: false,
          });
        });
        this.record.hod_verified = true;
        const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
        if (index > -1) {
          this.records[index].hod_verified = true;
        }
        this.applyFilter();
        this.updateSummary();
      },
      error: (error) => {
        console.error('HOD verification failed:', error);
        import('sweetalert2').then(Swal => {
          Swal.default.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to verify record. Error: ${error.message || 'Server error'}.`,
          });
        });
      }
    });
  }



  fetchRecords() {
    this.records = [];
    const requestsToFetch: any[] = [];

    const mapItemToRecord = (item: any, requestTypeOverride?: string) => {
      const user = item.user || {};

      // Improved student name extraction with fallback to profile if available
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

      // Program extraction with fallback to profile department if available
      let program = item.programme || item.user_program || user.program || user.department || 'N/A';
      if (requestTypeOverride === 'provisional' && item.programme) {
        program = item.programme;
      }

      // Determine status based on role and verification flags
      let status = 'Pending';
      if (this.role === 'hod') {
        status = item.hod_verified ? 'Verified' : 'Pending';
      } else if (this.role === 'bursar') {
        status = item.bursar_verified ? 'Verified' : 'Pending';
      } else if (this.role === 'exam_officer') {
        status = item.exam_officer_verified ? 'Verified' : 'Pending';
      } else if (this.role === 'admin') {
        // Admin sees overall status
        if (item.hod_verified && item.bursar_verified && item.exam_officer_verified) {
          status = 'Verified';
        } else if (item.hod_verified || item.bursar_verified || item.exam_officer_verified) {
          status = 'Partially Verified';
        } else {
          status = 'Pending';
        }
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
        exam_officer_verified: item.exam_officer_verified,
        user_id: user.id || item.user,
        status: status
      };
    };

    if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {
      requestsToFetch.push(
        this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
          .pipe(
            map(data => data.map(item => mapItemToRecord(item))), // Use common mapper
            catchError(error => {
              console.error('Error fetching transcript/certificate requests:', error);
              return of([]);
            })
          )
      );

      requestsToFetch.push(
        this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
          .pipe(
            map(data => data.map(item => mapItemToRecord(item, 'provisional'))), // Use common mapper, override type
            catchError(error => {
              console.error('Error fetching provisional requests:', error);
              return of([]);
            })
          )
      );
    }

    // Consolidate Bursar logic if API responses can be made similar
    if (requestsToFetch.length === 0 && (this.role === 'bursar')) {
      requestsToFetch.push(
        this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
          .pipe(map(data => data.map(item => mapItemToRecord(item))), catchError(() => of([]))) // Use common mapper
      );
      requestsToFetch.push(
        this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
          .pipe(map(data => data.map(item => mapItemToRecord(item, 'provisional'))), catchError(() => of([]))) // Use common mapper
      );
    }

    forkJoin(requestsToFetch).subscribe({
      next: (allResponses: any[][]) => {
        allResponses.forEach(responseArray => {
          this.records.push(...responseArray);
        });
        // Deduplicate records (if necessary, your existing logic)
        this.records = this.records.filter((record, index, self) =>
          index === self.findIndex((r) => (
            r.id === record.id && r.request_type === record.request_type
          ))
        );
        this.updateSummary();
        this.calculateCertificatesRequestedPerYear(); // Make sure this is called after records are fully processed
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error fetching combined records:', error);
      }
    });
  }

  updateSummary() {
    this.totalRequests = this.records.length;
    // Adjust verified count to count records verified by HOD (as example from financial-verifications)
    this.verifiedRequests = this.records.filter(r => r.hod_verified).length;
    this.pendingRequests = this.totalRequests - this.verifiedRequests;
  }


  calculateCertificatesRequestedPerYear() {
    const yearCounts: { [year: number]: number } = {};
    this.records.forEach(record => {
      const year = new Date(record.submitted_at).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
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
      studentDetails: {
        name: selectedRequest.student_name,
        program: selectedRequest.program,
        request_type: selectedRequest.request_type,
        submitted_at: selectedRequest.submitted_at
      },
      academicRecords: [],
      financialRecords: { details: [], has_pending_dues: false, total_paid: 0, total_due: 0 },
      certificates: [],
      fullProfile: null
    };

    const studentUserId = selectedRequest.user_id || selectedRequest.user;

    if (!studentUserId) {
      console.error("Student User ID not found in the selected record.", selectedRequest);
      alert("Cannot fetch details: Student User ID is missing.");
      this.record = null;
      return;
    }

    const dataObservables: any = {};

    dataObservables.profile = this.http.get<StudentProfile[]>(`${this.apiEndpoints.profiles}?user=${studentUserId}`)
      .pipe(
        map(profiles => profiles.length > 0 ? profiles[0] : null),
        catchError(error => {
          console.error('Error fetching student profile:', error);
          return of(null);
        })
      );

    if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.academic = this.http.get<any[]>(`${this.apiEndpoints.academicRecords}?user=${studentUserId}`)
        .pipe(
          catchError(error => {
            console.error('Error fetching academic records:', error);
            return of([]);
          })
        );
    }

    if (this.role === 'bursar' || this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.financial = forkJoin([
        this.http.get<any[]>(`${this.apiEndpoints.paymentRecords}?user=${studentUserId}`).pipe(catchError(() => of([]))),
        this.http.get<any[]>(`${this.apiEndpoints.otherPaymentRecords}?user=${studentUserId}`).pipe(catchError(() => of([])))
      ]).pipe(
        map(([mainPayments, otherPayments]) => {
          const allPayments = [...mainPayments, ...otherPayments];
          let totalPaid = 0;
          let totalDue = 0;
          const financialSummary: any[] = [];
          const paymentsByYear: { [key: string]: { paid: number, due: number } } = {};

          allPayments.forEach(payment => {
            const year = payment.academic_year_name || 'N/A';
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
          return {
            details: financialSummary,
            has_pending_dues: totalPaid < totalDue,
            total_paid: totalPaid,
            total_due: totalDue
          };
        }),
        catchError(error => {
          console.error('Error fetching financial records:', error);
          return of({ details: [], has_pending_dues: true, total_paid: 0, total_due: 0 });
        })
      );
    }

    if (this.role === 'exam_officer' || this.role === 'admin') {
      dataObservables.certificates = this.http.get<Certificate[]>(`${this.apiEndpoints.certificates}?user=${studentUserId}`)
        .pipe(
          // ****** MODIFIED CERTIFICATE MAPPING ******
          map(certs => certs.map(cert => ({
            ...cert,
            displayName: this.generateCertificateDisplayName(cert) // Use new function
          }))),
          // ****** END OF MODIFIED MAPPING ******
          catchError(error => {
            console.error('Error fetching certificates:', error);
            return of([]);
          })
        );
    }

    if (Object.keys(dataObservables).length === 0) {
      return;
    }

    forkJoin(dataObservables).subscribe((results: any) => {
      if (results.profile) {
        this.record.fullProfile = results.profile;
        if (results.profile.registration_number) {
          this.record.studentDetails.registration_number = results.profile.registration_number;
        }
      }
      if (results.academic) {
        this.record.academicRecords = results.academic;
      }
      if (results.financial) {
        this.record.financialRecords = results.financial;
      }
      if (results.certificates) {
        this.record.certificates = results.certificates;
      }
    });
  }

  // ****** NEW HELPER FUNCTION TO GENERATE DISPLAY NAME FOR CERTIFICATES ******
  generateCertificateDisplayName(certificate: Certificate): string {
    // Use certificate.name if it's a user-friendly name from backend,
    // otherwise, format certificate_type.
    // The backend might provide a filename in 'name', so be mindful.
    // If 'name' is intended as the primary display name from backend, use it.
    const baseName = certificate.name && certificate.name.trim() !== '' && !certificate.name.includes('/') ? // Avoid path-like names
      certificate.name :
      certificate.certificate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return baseName;
  }
  // ****** END OF NEW HELPER FUNCTION ******

  // ****** OLD getCertificateName FUNCTION (NO LONGER USED FOR DISPLAY STRING AS BEFORE) ******
  // This function was previously used to construct the full link text including date.
  // It's kept here for reference or if you had other uses for it, but the display logic is now separated.
  getCertificateName(certificate: Certificate): string {
    const type = certificate.certificate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Avoid using date here for the primary name if it's displayed separately
    // const date = new Date(certificate.issued_date).toLocaleDateString(); // This was a source of "Invalid Date"
    return `${type}`; // Simplified: just return the type or formatted name
  }
  // ****** END OF OLD FUNCTION ******


  // ****** NEW HELPER FUNCTION TO VALIDATE DATE STRINGS ******
  isValidDate(dateString: any): boolean {
    if (!dateString) return false; // Handles null, undefined, empty string
    const date = new Date(dateString);
    // Check if date is a valid Date object and not "Invalid Date"
    // getTime() will be NaN for invalid dates
    return !isNaN(date.getTime());
  }
  // ****** END OF NEW HELPER FUNCTION ******


  printCertificate() {
    if (!this.record) {
      alert("No record selected.");
      return;
    }

    if (!this.record.exam_officer_verified) {
      alert("Certificate/Transcript can only be generated after final verification by the Exam Officer.");
      return;
    }

    const documentType = this.record.studentDetails?.request_type;
    const studentName = this.record.studentDetails?.name;

    let downloadUrl = '';
    if (documentType === 'transcript') {
      downloadUrl = `http://localhost:8000/api/generate-transcript/?request_id=${this.record.id}&user_id=${this.record.user_id}`;
    } else if (documentType === 'certificate' || documentType === 'provisional') {
      downloadUrl = `http://localhost:8000/api/generate-certificate/?request_id=${this.record.id}&user_id=${this.record.user_id}&type=${documentType}`;
    } else {
      alert("Unsupported request type for certificate/transcript generation.");
      return;
    }

    console.log(`Attempting to generate and open: ${downloadUrl}`);
    window.open(downloadUrl, '_blank');
    alert(`Initiating generation of ${documentType} for ${studentName}. Check new tab for download.`);
  }

  overrideVerification() {
    if (!this.record || !this.record.id) {
      alert("No record selected for override.");
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
      exam_officer_approved: true,
    };

    this.http.patch(apiEndpoint, payload)
      .subscribe({
        next: (response: any) => {
          console.log('Override verification successful:', response);
          alert('Override successful! All steps verified.');
          this.record.hod_verified = true;
          this.record.bursar_verified = true;
          this.record.exam_officer_verified = true;

          const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
          if (index > -1) {
            this.records[index].hod_verified = true;
            this.records[index].bursar_verified = true;
            this.records[index].exam_officer_verified = true;
          }
          // It's better to refetch the specific record or update locally accurately
          // fetchRecords() might be too broad if it reloads everything.
          this.applyFilter(); // To reflect changes if summary depends on filtered list.
          this.updateSummary();
        },
        error: (error) => {
          console.error('Override verification failed:', error);
          alert(`Failed to override verification. Error: ${error.message || 'Server error'}.`);
        }
      });
  }


  // Add this new function to the component class
  getRequestStatus(record: any): { text: string; class: string } {
    if (record.hod_verified && record.bursar_verified && record.exam_officer_verified) {
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
    return record.hod_verified && record.bursar_verified && record.exam_officer_verified;
  }

}
