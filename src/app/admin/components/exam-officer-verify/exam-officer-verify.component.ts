import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// Interface for Certificate data
interface Certificate {
  id: number;
  user: number;
  certificate_type: string;
  file_url: string;
  issued_date: string;
  name?: string;
  displayName?: string;
}

// Interface for Student Profile data
interface StudentProfile {
  id: number;
  user: number;
  registration_number?: string;
  phone_number?: string;
  program_name?: string; // Expecting program name from the backend profile
}

@Component({
  selector: 'app-exam-officer-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './exam-officer-verify.component.html',
  styleUrls: ['./exam-officer-verify.component.css']
})
export class ExamOfficerVerifyComponent implements OnInit {

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
  private apiEndpoints = {
    transcriptCertificateRequests: `${this.API_BASE_URL}transcript-certificate-requests/`,
    provisionalRequests: `${this.API_BASE_URL}provisional-requests/`,
    profiles: `${this.API_BASE_URL}profiles/`,
  };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.role = localStorage.getItem('userRole') || 'exam_officer';
    this.fetchRecords();
  }

  private showSwal(title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info', timer?: number) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({ icon, title, text, timer, showConfirmButton: !timer });
    });
  }

  fetchRecords() {
    this.records = [];
    const mapItemToRecord = (item: any, type: string) => ({
      ...item,
      request_type: type,
      student_name: `${item.user?.first_name || item.user_first_name || ''} ${item.user?.last_name || item.user_last_name || ''}`.trim() || 'N/A',
      program: item.user?.profile?.program || item.programme || item.user_program || 'N/A',
      submitted_at: new Date(item.submitted_at),
      user_id: item.user?.id || item.user,
      exam_officer_verified: !!item.exam_officer_approved,
    });

    forkJoin({
      transcripts: this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests).pipe(map(data => data.map(item => mapItemToRecord(item, item.request_type))), catchError(() => of([]))),
      provisionals: this.http.get<any[]>(this.apiEndpoints.provisionalRequests).pipe(map(data => data.map(item => mapItemToRecord(item, 'provisional'))), catchError(() => of([])))
    }).subscribe(({ transcripts, provisionals }) => {
      this.records = [...transcripts, ...provisionals];
      this.updateSummary();
      this.applyFilter();
    });
  }

  updateSummary() {
    this.totalRequests = this.records.length;
    this.verifiedRequests = this.records.filter(r => this.isRequestComplete(r)).length;
    this.pendingRequests = this.totalRequests - this.verifiedRequests;
  }

  applyFilter(): void {
    let tempRecords = [...this.records];
    if (this.filterOption !== 'all') {
      const today = new Date();
      tempRecords = tempRecords.filter(r => {
        const submitted = new Date(r.submitted_at);
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
      tempRecords = tempRecords.filter(r => new Date(r.submitted_at) >= start && new Date(r.submitted_at) <= end);
    }
    this.filteredRecords = tempRecords;
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
      fullProfile: null,
    };
    const studentUserId = selectedRequest.user_id;
    if (!studentUserId) {
      this.showSwal('Error', 'Student User ID not found.', 'error');
      return;
    }
    this.http.get<StudentProfile>(`${this.apiEndpoints.profiles}${studentUserId}/`).subscribe(profile => {
      this.record.fullProfile = profile;
       if(profile.program_name && this.record.studentDetails){
          this.record.studentDetails.program = profile.program_name;
      }
    });
  }

  // The 'role' parameter is optional to match the template call.
  verify(role?: 'exam_officer') {
    if (!this.record) return;
    const roleInfo = { prop: 'exam_officer_verified', name: 'Exam Officer' };

    if (this.record[roleInfo.prop]) {
      this.showSwal('Info', 'This request is already verified.', 'info');
      return;
    }
    if (!this.record.hod_verified || !this.record.bursar_verified) {
        this.showSwal('Error', 'HOD and Bursar must verify first.', 'error');
        return;
    }

    const apiEndpoint = this.record.request_type === 'provisional' ? `${this.apiEndpoints.provisionalRequests}${this.record.id}/` : `${this.apiEndpoints.transcriptCertificateRequests}${this.record.id}/`;
    const payload = { exam_officer_approved: true };

    this.http.patch(apiEndpoint, payload).subscribe({
      next: () => {
        this.showSwal('Success', `${roleInfo.name} verification successful.`, 'success', 2000);
        this.record[roleInfo.prop] = true;
        const index = this.records.findIndex(r => r.id === this.record.id && r.request_type === this.record.request_type);
        if (index > -1) {
            this.records[index][roleInfo.prop] = true;
        }

        this.updateSummary();
        this.applyFilter();
      },
      error: (err) => this.showSwal('Error', `Verification failed: ${err.message}`, 'error')
    });
  }

  generatePdfReport() {
    if (this.filteredRecords.length === 0) {
      this.showSwal('Info', 'No data to generate a report.', 'info');
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
     const logoPath = 'assets/logo/udom_logo2.png';
    doc.addImage(logoPath, 'PNG', 15, 10, 30, 30);
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('THE UNIVERSITY OF DODOMA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('CERTIFICATE REQUESTS REPORT', pageWidth / 2, 28, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 15, 45, { align: 'right' });

    autoTable(doc, {
      startY: 50,
      head: [['#', 'Student Name', 'Program', 'Request Type', 'Submitted', 'Status']],
      body: this.filteredRecords.map((r, i) => [
        i + 1,
        r.student_name,
        r.program,
        r.request_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        new Date(r.submitted_at).toLocaleDateString(),
        this.getRequestStatus(r).text
      ]),
      theme: 'grid',
      styles: { font: 'times' },
      headStyles: { fillColor: [2, 37, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
    });


    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`requests_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.showSwal('Success', 'PDF report generated successfully!', 'success');
  }

  captureBiometric() {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: 'Capturing Biometric Data',
        html: `Please ask <strong>${this.record.student_name}</strong> to place their finger on the scanner.`,
        timer: 2500,
        didOpen: () => { Swal.default.showLoading(); },
      }).then((result) => {
        if (result.dismiss === Swal.default.DismissReason.timer) {
          if (Math.random() > 0.1) {
             this.showSwal('Success!', 'Biometric data captured successfully.', 'success');
          } else {
             this.showSwal('Capture Failed', 'Could not verify biometric data. Please try again.', 'error');
          }
        }
      });
    });
  }

  printCertificate() {
    this.showSwal('Info', `Generating ${this.record.studentDetails?.request_type} for ${this.record.student_name}...`, 'info', 2000);
  }

  isRequestComplete = (r: any) => !!r?.hod_verified && !!r?.bursar_verified && !!r?.exam_officer_verified;

  getRequestStatus = (r: any) => {
    if (this.isRequestComplete(r)) return { text: 'Complete', class: 'bg-success' };
    if (r.hod_verified && r.bursar_verified) return { text: 'Pending Exam Officer', class: 'bg-info text-dark' };
    if (r.hod_verified) return { text: 'Pending Bursar', class: 'bg-primary' };
    return { text: 'Pending HOD', class: 'bg-warning text-dark' };
  };
}
