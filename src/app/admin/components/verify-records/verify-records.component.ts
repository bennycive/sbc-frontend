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

  role: string = 'exam_officer';

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
    this.fetchRecords();
    // Example: Set role dynamically based on actual user role service
    // this.role = this.authService.getUserRole();
  }

  // fetchRecords() {
  //   this.records = [];
  //   const requestsToFetch: any[] = [];

  //   if (this.role === 'hod' || this.role === 'exam_officer' || this.role === 'admin') {
  //     requestsToFetch.push(
  //       this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
  //         .pipe(
  //           map(data => data.map(item => ({
  //             ...item,
  //             id: item.id,
  //             request_type: item.request_type,
  //             student_name: item.user.first_name + ' ' + item.user.last_name,
  //             program: item.programme,
  //             submitted_at: new Date(item.submitted_at),
  //             hod_verified: item.hod_verified,
  //             bursar_verified: item.bursar_verified,
  //             exam_officer_verified: item.exam_officer_approved,
  //             user_id: item.user
  //           }))),
  //           catchError(error => {
  //             console.error('Error fetching transcript/certificate requests:', error);
  //             return of([]);
  //           })
  //         )
  //     );

  //     requestsToFetch.push(
  //       this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
  //         .pipe(
  //           map(data => data.map(item => ({
  //             ...item,
  //             id: item.id,
  //             request_type: 'provisional',
  //             student_name: item.first_name + ' ' + item.last_name,
  //             program: item.programme,
  //             submitted_at: new Date(item.submitted_at),
  //             hod_verified: item.hod_verified,
  //             bursar_verified: item.bursar_verified,
  //             exam_officer_verified: item.exam_officer_approved,
  //             user_id: item.user
  //           }))),
  //           catchError(error => {
  //             console.error('Error fetching provisional requests:', error);
  //             return of([]);
  //           })
  //         )
  //     );
  //   }

  //   if (requestsToFetch.length === 0 && (this.role === 'bursar')) {
  //       requestsToFetch.push(
  //         this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
  //           .pipe(map(data => data.map(item => ({ ...item, request_type: item.request_type, student_name: item.user_username, program: item.user_program, submitted_at: new Date(item.submitted_at), hod_verified: item.hod_verified, bursar_verified: item.bursar_verified, exam_officer_verified: item.exam_officer_approved, user_id: item.user }))), catchError(() => of([])))
  //       );
  //       requestsToFetch.push(
  //         this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
  //           .pipe(map(data => data.map(item => ({ ...item, request_type: 'provisional', student_name: item.user_username, program: item.programme, submitted_at: new Date(item.submitted_at), hod_verified: item.hod_verified, bursar_verified: item.bursar_verified, exam_officer_verified: item.exam_officer_approved, user_id: item.user }))), catchError(() => of([])))
  //       );
  //   }

  //   forkJoin(requestsToFetch).subscribe({
  //     next: (allResponses: any[][]) => {
  //       allResponses.forEach(responseArray => {
  //         this.records.push(...responseArray);
  //       });
  //       this.records = this.records.filter((record, index, self) =>
  //           index === self.findIndex((r) => (
  //             r.id === record.id && r.request_type === record.request_type
  //           ))
  //       );
  //       this.updateSummary();
  //       this.calculateCertificatesRequestedPerYear();
  //       this.applyFilter();
  //     },
  //     error: (error) => {
  //       console.error('Error fetching combined records:', error);
  //     }
  //   });
  // }

  fetchRecords() {
    this.records = [];
    const requestsToFetch: any[] = [];

    const mapItemToRecord = (item: any, requestTypeOverride?: string) => {
    const user = item.user || {};

    console.log('API ITEM RECEIVED:', JSON.stringify(item, null, 2));
    // VITAL DEBUGGING STEPS:
    console.log('Original API item received:', JSON.stringify(item, null, 2)); // Log the whole item
    console.log('Extracted item.user part:', JSON.stringify(item.user, null, 2)); // Log just the item.user part
    console.log('Assigned user variable:', JSON.stringify(user, null, 2)); // Log the 'user' variable after 'item.user || {}'

    const firstName = user.first_name || item.user_first_name || item.first_name || '';
    const lastName = user.last_name || item.user_last_name || item.last_name || '';

    let studentName = (firstName + ' ' + lastName).trim();
    if (!studentName && (user.username || item.user_username)) {
      studentName = user.username || item.user_username;
    } else if (!studentName) { // This means studentName was empty after trying first/last and username
      studentName = 'N/A';
    }

    // If you see "undefined" in the table, it might be that studentName became "undefined undefined"
    // and then the if conditions were not met as "undefined undefined" is not falsy.
    // Let's refine the studentName logic slightly for robustness:

    let fName = user.first_name || item.user_first_name || item.first_name;
    let lName = user.last_name || item.user_last_name || item.last_name;

    if (fName && lName) {
        studentName = `${fName} ${lName}`;
    } else if (fName) {
        studentName = fName;
    } else if (lName) {
        studentName = lName;
    } else if (user.username) {
        studentName = user.username;
    } else if (item.user_username) {
        studentName = item.user_username;
    } else {
        studentName = 'N/A'; // Default if no name components found
    }


    // Consolidate program logic
    let program = item.programme || item.user_program || user.program || user.department || 'N/A'; // Added user.department as a common source
    if (requestTypeOverride === 'provisional' && item.programme) {
        program = item.programme;
    }

    return {
      ...item, // Spread original item first
      id: item.id,
      request_type: requestTypeOverride || item.request_type,
      student_name: studentName.trim(), // Ensure student_name is a string
      program: program,
      submitted_at: this.isValidDate(item.submitted_at) ? new Date(item.submitted_at) : new Date(0),
      hod_verified: item.hod_verified,
      bursar_verified: item.bursar_verified,
      exam_officer_verified: item.exam_officer_approved,
      user_id: user.id || item.user // Prioritize ID from nested object if present
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
    this.verifiedRequests = this.records.filter(r => r.exam_officer_verified).length;
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

  verify(verificationRole: string) {
    console.log('Verify function called for role:', verificationRole);
    if (!this.record || !this.record.id) {
      console.warn('No record selected or record ID missing for verification.');
      alert('Please select a record to verify.');
      return;
    }

    let apiEndpoint = '';
    let payload: any = {};

    if (this.record.request_type === 'provisional') {
      apiEndpoint = `${this.apiEndpoints.provisionalRequests}${this.record.id}/`;
    } else if (this.record.request_type === 'transcript' || this.record.request_type === 'certificate') {
      apiEndpoint = `${this.apiEndpoints.transcriptCertificateRequests}${this.record.id}/`;
    } else {
      console.error('Unknown request type for verification:', this.record.request_type);
      alert('Cannot verify: Unknown request type.');
      return;
    }

    if (verificationRole === 'hod') {
      payload = { hod_verified: true };
    } else if (verificationRole === 'bursar') {
      payload = { bursar_verified: true };
    } else if (verificationRole === 'exam_officer') {
      payload = { exam_officer_approved: true };
    } else {
      console.error('Unknown verification role:', verificationRole);
      return;
    }

    this.http.patch(apiEndpoint, payload)
      .subscribe({
        next: (response: any) => {
          console.log(`${verificationRole} verification successful:`, response);
          alert(`${verificationRole} verification successful!`);

          if (verificationRole === 'hod') this.record.hod_verified = true;
          if (verificationRole === 'bursar') this.record.bursar_verified = true;
          if (verificationRole === 'exam_officer') this.record.exam_officer_verified = true;

          const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
          if (index > -1) {
            if (verificationRole === 'hod') this.records[index].hod_verified = true;
            if (verificationRole === 'bursar') this.records[index].bursar_verified = true;
            if (verificationRole === 'exam_officer') this.records[index].exam_officer_verified = true; // This should be exam_officer_approved based on payload
            // Ensure consistency if 'exam_officer_verified' is the local state variable
            // and 'exam_officer_approved' is the API field.
            // Here, assuming exam_officer_verified is the correct local state property.
            this.applyFilter();
            this.updateSummary();
            this.calculateCertificatesRequestedPerYear();
          }
        },
        error: (error) => {
          console.error(`${verificationRole} verification failed:`, error);
          alert(`Verification failed for ${verificationRole}. Error: ${error.message || 'Server error'}. Check console for details.`);
        }
      });
  }

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

  generateReport() {
    if (this.filteredRecords.length === 0) {
      alert("No records to generate a report for the current filter.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = [
      "ID", "Student Name", "Program", "Request Type", "Submitted At",
      "HOD Verified", "Bursar Verified", "Exam Officer Verified"
    ];
    // For dynamic headers like registration number, you'd ideally fetch this data
    // for all filtered records if it's not already part of the 'record' object in the list.
    // The current logic for adding headers conditionally based on 'this.record' is flawed
    // for a report of 'filteredRecords'.

    csvContent += headers.join(",") + "\r\n";

    this.filteredRecords.forEach(record => {
      let row = [
        record.id,
        `"${record.student_name || ''}"`,
        `"${record.program || ''}"`,
        `"${record.request_type || ''}"`,
        `"${this.isValidDate(record.submitted_at) ? new Date(record.submitted_at).toLocaleDateString() : 'Invalid Date'}"`,
        record.hod_verified ? "Yes" : "No",
        record.bursar_verified ? "Yes" : "No",
        record.exam_officer_verified ? "Yes" : "No"
        // Add data for conditionally added headers here, ensuring it comes from the 'record' in the loop
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_requests_report_${this.filterOption}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Report for ${this.filteredRecords.length} records generated successfully!`);
  }

  isRequestComplete(record: any): boolean {
    return record.hod_verified && record.bursar_verified && record.exam_officer_verified;
  }

}
