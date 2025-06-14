import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule, CurrencyPipe } from '@angular/common';

// Import NgbModal and other required members from ng-bootstrap
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

// --- Interfaces ---

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface FinancialRequest {
  id: number;
  user: User;
  request_type?: string;
  number_of_copies?: number;
  submitted_at: string;
  bursar_verified: boolean;
  current_address?: string;
  email_or_phone?: string;
  year_of_admission?: string;
  year_of_study?: string;
  programme?: string;
  semester_range?: string;
}

interface PaymentRecord {
    date: string;
    payment_type: string;
    reference_no: string;
    fee: number;
    payment: number;
    balance: number;
}

interface FinancialDetails {
  payment_records: PaymentRecord[];
  other_payment_records: PaymentRecord[];
}


@Component({
  selector: 'app-financial-verifications',
  templateUrl: './financial-verifications.component.html',
  styleUrls: ['./financial-verifications.component.css'],
  // This component is standalone
  standalone: true,
  // Import necessary modules for the template
  imports: [CommonModule, NgbModule, CurrencyPipe],
  // Provide the DatePipe service
  providers: [DatePipe],
})
export class FinancialVerificationsComponent implements OnInit {
  transcriptRequests: FinancialRequest[] = [];
  provisionalRequests: FinancialRequest[] = [];
  selectedStudentFinancials: FinancialDetails | null = null;
  selectedStudentName: string = '';

  // --- API URLs ---
  private baseUrl = 'http://127.0.0.1:8000/api/users/';
  private transcriptApiUrl = `${this.baseUrl}transcript-certificate-requests/`;
  private provisionalApiUrl = `${this.baseUrl}provisional-requests/`;
  private financialDetailsApiUrl = `${this.baseUrl}student-financials/`;
  private userDetailsApiUrl = `${this.baseUrl}users/`; // Corrected endpoint for user details

  // --- Services Injection using inject() ---
  private http = inject(HttpClient);
  private datePipe = inject(DatePipe);
  private modalService = inject(NgbModal);

  ngOnInit(): void {
    this.loadAllRequests();
  }

  loadAllRequests(): void {
    this.loadTranscriptRequests();
    this.loadProvisionalRequests();
  }

  // Load transcript requests from the API
  loadTranscriptRequests() {
    this.http.get<FinancialRequest[]>(this.transcriptApiUrl).subscribe({
      next: (data) => {
        this.transcriptRequests = data;
        this.loadUserDetailsForRequests(this.transcriptRequests);
      },
      error: (err) => console.error('Failed to load transcript requests', err),
    });
  }

  // Load provisional requests from the API
  loadProvisionalRequests() {
    this.http.get<FinancialRequest[]>(this.provisionalApiUrl).subscribe({
      next: (data) => {
        this.provisionalRequests = data;
        this.loadUserDetailsForRequests(this.provisionalRequests);
      },
      error: (err) => console.error('Failed to load provisional requests', err),
    });
  }

  // New method to load user details by user ID for requests
  loadUserDetailsForRequests(requests: FinancialRequest[]) {
    requests.forEach(req => {
      if (req.user && req.user.id) {
        this.http.get<User>(`${this.userDetailsApiUrl}${req.user.id}/`).subscribe({
          next: (userData) => {
            req.user.first_name = userData.first_name || '';
            req.user.last_name = userData.last_name || '';
            req.user.username = userData.username || '';
          },
          error: (err) => {
            console.error(`Failed to load user details for user ID ${req.user.id}`, err);
          }
        });
      }
    });
  }

  // Verify a request and update its status
  // The event parameter is now optional to prevent compiler errors.
  verifyRequest(requestType: string, id: number, event?: MouseEvent) {
    // Stop the click from propagating to the table row's click handler
    if (event) {
      event.stopPropagation();
    }

    const url = `${this.baseUrl}financial-verifications/${requestType}/${id}/update-bursar/`;
    this.http.post(url, { verified: true }).subscribe({
      next: () => {
        // Reload the data to reflect the change
        this.loadAllRequests();
      },
      error: (err) => console.error('Failed to update bursar verification', err),
    });
  }

  // Open a modal to show student's financial details
  viewFinancialDetails(content: TemplateRef<any>, studentId: number, studentName: string) {
    this.selectedStudentName = studentName;
    // Fetch financial details for the selected student
    this.http.get<FinancialDetails>(`${this.financialDetailsApiUrl}${studentId}/`).subscribe({
        next: (data) => {
            this.selectedStudentFinancials = data;
            // Open the modal with the fetched data
            this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' });
        },
        error: (err) => {
            console.error('Failed to load financial details', err);
            // Even if fetching fails, you might want to open the modal with an error message.
            this.selectedStudentFinancials = { payment_records: [], other_payment_records: [] };
            this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' });
        }
    });
  }

  // Format date strings for display
  formatDate(dateStr: string): string | null {
    return this.datePipe.transform(dateStr, 'medium');
  }
}
