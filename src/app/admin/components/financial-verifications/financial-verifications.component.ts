import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';

interface FinancialRequest {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  bursar_verified: boolean;
  submitted_at: string;
  payment_records: any[];
  other_payment_records: any[];
  // Add other fields as needed
}

@Component({
  selector: 'app-financial-verifications',
  templateUrl: './financial-verifications.component.html',
  styleUrls: ['./financial-verifications.component.css'],
  providers: [DatePipe],
  standalone: true,
  imports: [CommonModule]
})
export class FinancialVerificationsComponent implements OnInit {
  pendingTranscriptRequests: FinancialRequest[] = [];
  pendingProvisionalRequests: FinancialRequest[] = [];
  verifiedTranscriptRequests: FinancialRequest[] = [];
  verifiedProvisionalRequests: FinancialRequest[] = [];

  selectedRequest: FinancialRequest | null = null;
  selectedRequestType: string | null = null;
  showModal: boolean = false;

  apiUrl = 'http://127.0.0.1:8000/api/users/financial-verifications/';

  constructor(private http: HttpClient, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.loadFinancialVerifications();
  }

  loadFinancialVerifications() {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (data) => {
        this.pendingTranscriptRequests = data.pending_transcript_requests;
        this.pendingProvisionalRequests = data.pending_provisional_requests;
        this.verifiedTranscriptRequests = data.verified_transcript_requests;
        this.verifiedProvisionalRequests = data.verified_provisional_requests;
      },
      error: (err) => console.error('Failed to load financial verifications', err),
    });
  }

  openModal(requestType: string, request: FinancialRequest) {
    this.selectedRequestType = requestType;
    this.selectedRequest = request;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
    this.selectedRequestType = null;
  }

  verifySelectedRequest() {
    if (this.selectedRequest && this.selectedRequestType) {
      this.updateBursarVerification(this.selectedRequestType, this.selectedRequest.id, true);
      this.closeModal();
    }
  }

  updateBursarVerification(requestType: string, id: number, verified: boolean) {
    const url = `${this.apiUrl}${requestType}/${id}/update-bursar/`;
    this.http.post(url, { verified }).subscribe({
      next: () => {
        this.loadFinancialVerifications();
      },
      error: (err) => console.error('Failed to update bursar verification', err),
    });
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'medium') || '';
  }
}
