import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // Adjust path as needed
import { HttpClient, HttpClientModule }from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Chart, registerables, ChartConfiguration } from 'chart.js/auto'; // Import ChartConfiguration
import { PreloaderComponent } from '../components/preloader/preloader.component';
import { DepartmentService } from '../../services/department.service';
import { CourseService } from '../../services/course.service';
import Swal from 'sweetalert2';

// --- Interfaces ---
interface CustomUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'hod' | 'bursar' | 'admin' | 'exam-officer' | '';
  department?: string; // Program name or department user belongs to
  program?: string; // Added program field
  biometric_setup_complete?: boolean; // Example field for biometric status
  profile?: { // Example if biometric info is in profile
    nida?: string;
    // ... other profile fields
  };
}

interface TranscriptRequestItem { // For data coming directly from API
  id: number;
  user: { // Assuming user is now a nested object from your serializers
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    department?: string; // Or program
  } | number; // Fallback if API sometimes sends ID
  request_type: string;
  submitted_at: string; // Assuming ISO date string
  hod_verified: boolean;
  bursar_verified: boolean;
  exam_officer_approved: boolean;
  // Add other fields from your API response for these items
  programme?: string; // If provisional requests have this
  program_name?: string; // If transcript requests have this from serializer
}

interface SummaryCard {
  title: string;
  value: string | number;
  icon: string;
  colorClass?: string; // Optional: e.g., 'text-primary', 'text-success'
}

interface TableRow {
  id?: number; // Useful for actions or navigation
  student?: string;
  course?: string;  // For HOD table, represents Program
  program?: string; // General program field
  request_type?: string; // Explicitly added
  amount?: string | number;
  date?: string | Date; // Can be pre-formatted string or Date object
  [key: string]: any; // Keep for flexibility if other dynamic columns are added
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, PreloaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('requestChart') requestChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  currentUserRole: 'student' | 'hod' | 'bursar' | 'admin' | 'exam-officer' | '' = '';
  filterBy: string = 'daily'; // For chart
  formattedDate: string = '';
  user: CustomUser | null = null;
  private subscriptions: Subscription = new Subscription();

  loading: boolean = false; // For preloader

  // Dynamic Data Properties
  studentSummaryCards: SummaryCard[] = [];
  hodSummaryCards: SummaryCard[] = [];
  hodVerificationRequests: TableRow[] = [];
  bursarSummaryCards: SummaryCard[] = [];
  bursarVerifiedFinancials: TableRow[] = [];
  bursarPendingFinancialVerifications: TableRow[] = [];
  adminHodLikeCards: SummaryCard[] = [];
  adminBursarLikeCards: SummaryCard[] = [];

  // API Endpoints
  private API_BASE_URL = 'http://localhost:8000/api/'; // Adjust if your base URL is different
  private apiEndpoints = {
    users: `${this.API_BASE_URL}users/users/`, // e.g., /api/users/users/{id}/
    transcriptCertificateRequests: `${this.API_BASE_URL}users/transcript-certificate-requests/`,
    provisionalRequests: `${this.API_BASE_URL}users/provisional-requests/`,
    // DEFINE THESE BACKEND ENDPOINTS:
    hodSummary: `${this.API_BASE_URL}dashboard/hod/summary/`,
    // For HOD table, use transcriptCertificateRequests and filter by HOD status or a specific endpoint
    hodPendingRequests: `${this.API_BASE_URL}users/transcript-certificate-requests/`,
    bursarSummary: `${this.API_BASE_URL}dashboard/bursar/summary/`,
    bursarVerifiedFinancials: `${this.API_BASE_URL}dashboard/bursar/financials/`,
    adminSummary: `${this.API_BASE_URL}users/dashboard/admin/summary/`,
    requestTrendsChart: `${this.API_BASE_URL}dashboard/chart/request-trends/`
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {
    Chart.register(...registerables);
  }

  async checkBiometricRegistration(): Promise<void> {
    console.log('checkBiometricRegistration: Initiating biometric check...');
    try {
      const response = await this.http.get<{ biometric_registered: boolean }>(
        'http://localhost:8000/api/users/webauthn/registered/',
        { withCredentials: true }
      ).toPromise();

      console.log('checkBiometricRegistration: API Response:', response);

      if (this.user && response) {
        this.user.biometric_setup_complete = response.biometric_registered;
        console.log('checkBiometricRegistration: user.biometric_setup_complete set to:', this.user.biometric_setup_complete);
        this.authService.updateUser(this.user); // Update user in AuthService localStorage cache
        console.log('checkBiometricRegistration: User object updated in AuthService.');
      } else {
        console.warn('checkBiometricRegistration: User object or API response is null/undefined.');
      }
    } catch (error) {
      console.error('checkBiometricRegistration: Error checking biometric registration:', error);
      // Even if there's an error, assume not registered to be safe
      if (this.user) {
        this.user.biometric_setup_complete = false;
        this.authService.updateUser(this.user); // Persist this 'false' status
        console.log('checkBiometricRegistration: Setting biometric_setup_complete to false due to error.');
      }
    }
  }

  ngOnInit(): void {
    this.formattedDate = this.getFormattedDate();
    this.user = this.authService.getUser(); // Get user from cache/local storage initially

    console.log('ngOnInit: Initial user object from AuthService:', this.user);


    if (this.user && this.user.id) {
      this.currentUserRole = this.user.role;
      this.loadDashboardData();
    } else {
      console.error("Dashboard: Logged in user or user ID not found from AuthService. Redirecting to login...");
      this.router.navigate(['/login']); // Consider redirecting to login if no user
    }
  }

  ngAfterViewInit(): void {
    if (this.currentUserRole && !['student'].includes(this.currentUserRole)) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  loadDashboardData(): void {
    if (!this.user || !this.user.id) {
      console.warn("loadDashboardData: No user or user ID, cannot load data.");
      this.loading = false;
      return;
    }

    this.loading = true; // Show preloader

    if (this.currentUserRole === 'student') {
      // First, check biometric registration
      this.checkBiometricRegistration().then(() => {
        // After biometric check, re-fetch the user object to ensure it's updated
        this.user = this.authService.getUser();
        console.log('loadDashboardData: User object after biometric check and re-fetch:', this.user);
        // Then, fetch student dashboard data
        this.fetchStudentDashboardData(this.user!.id);
      }).catch(error => {
        console.error('loadDashboardData: Error during biometric check before loading student data:', error);
        // Still proceed to fetch other student data even if biometric check fails
        // Re-fetch user to ensure the biometric_setup_complete status (even if false) is updated.
        this.user = this.authService.getUser();
        this.fetchStudentDashboardData(this.user!.id);
      });
    } else {
      this.fetchCombinedRequests().subscribe((combinedRequests) => {
        switch (this.currentUserRole) {
          case 'exam-officer':
            this.processExamOfficerData(combinedRequests);
            break;
          case 'hod':
            this.processHodData(combinedRequests);
            break;
          case 'bursar':
            this.processBursarData(combinedRequests);
            break;
          case 'admin':
            this.processAdminData(combinedRequests);
            break;
          default:
            console.warn("Unknown user role or no role defined for dashboard:", this.currentUserRole);
            this.loading = false; // Hide preloader if unknown role
        }
      }, (error) => {
        console.error('Error fetching combined requests:', error);
        this.loading = false;
      });
    }
  }

  private isValidDate(dateString: any): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private processHodData(requests: any[]) {
    // Fetch HOD summary data from backend endpoint for accurate counts
    this.http.get<any>(this.apiEndpoints.hodSummary)
      .pipe(catchError(() => of({ classes: 0, departments: 0, students: 0 })))
      .subscribe(summary => {
        this.hodSummaryCards = [
          { title: 'Classes Managed', value: summary.classes || 0, icon: 'bi bi-easel', colorClass: 'text-success' },
          { title: 'Departments Overseen', value: summary.departments || 0, icon: 'bi bi-building', colorClass: 'text-success' },
          { title: 'Total Students in Depts', value: summary.students || 0, icon: 'bi bi-people', colorClass: 'text-success' }
        ];
        this.loading = false;
      });

    // Filter requests relevant to HOD (e.g., those not yet verified by HOD)
    const hodPendingRequests = requests.filter(r => !r.hod_verified && !r.exam_officer_verified);

    this.hodVerificationRequests = hodPendingRequests.map(req => ({
      id: req.id,
      student: req.student_name,
      course: req.program,
      request_type: req.request_type,
      date: this.datePipe.transform(req.submitted_at, 'mediumDate') || 'N/A',
    }));
  }

  private processBursarData(requests: any[]) {
    // Filter requests relevant to bursar
    const allRequests = requests.length;
    const pendingBursar = requests.filter(r => !r.bursar_verified).length;
    const completedByBursar = requests.filter(r => r.bursar_verified).length;
    const rejectedByBursar = 0; // Placeholder, depends on API data

    this.bursarSummaryCards = [
      { title: 'All Financial Requests', value: allRequests, icon: 'bi bi-envelope', colorClass: 'text-primary' },
      { title: 'Pending My Verification', value: pendingBursar, icon: 'bi bi-clock-history', colorClass: 'text-primary' },
      { title: 'Verified by Me', value: completedByBursar, icon: 'bi bi-check-circle', colorClass: 'text-primary' },
      { title: 'Rejected by Me', value: rejectedByBursar, icon: 'bi bi-x-circle', colorClass: 'text-primary' }
    ];

    // Fetch bursar verified financials from existing endpoint
    this.http.get<any[]>(`${this.apiEndpoints.bursarVerifiedFinancials}?bursar_verified=true&limit=10`)
      .pipe(
        map(records => records.map((rec): TableRow => {
          let studentName = 'N/A';
          if (typeof rec.user === 'object' && rec.user !== null) {
            studentName = `${rec.user.first_name || ''} ${rec.user.last_name || ''}`.trim() || rec.user.username || 'Unknown';
          } else if (rec.student_name) {
            studentName = rec.student_name;
          } else if (rec.user_id || rec.user) {
            studentName = `User ID: ${rec.user_id || rec.user}`;
          }
          return {
            student: studentName,
            amount: this.datePipe.transform(rec.amount_paid || rec.amount, 'currency', 'USD', 'symbol') || '$0.00',
            date: this.datePipe.transform(rec.payment_date || rec.date, 'mediumDate') || 'N/A'
          };
        })),
        catchError(() => of([]))
      )
      .subscribe(data => {
        this.bursarVerifiedFinancials = data;
        this.loading = false;
      });
  }

  private processAdminData(requests: any[]) {
    // Fetch admin summary data from backend endpoint for accurate counts
    this.http.get<any>(this.apiEndpoints.adminSummary)
      .pipe(catchError(() => of({
        total_classes: 0, total_departments: 0, total_students: 0,
        total_requests: 0, total_pending: 0, total_completed: 0, total_rejected: 0
      })))
      .subscribe(summary => {
        this.adminHodLikeCards = [
          { title: 'Total Classes', value: summary.total_classes || 0, icon: 'bi bi-easel', colorClass: 'text-success' },
          { title: 'Total Departments', value: summary.total_departments || 0, icon: 'bi bi-building', colorClass: 'text-success' },
          { title: 'Total Students', value: summary.total_students || 0, icon: 'bi bi-people', colorClass: 'text-success' }
        ];
        this.adminBursarLikeCards = [
          { title: 'Total System Requests', value: summary.total_requests || 0, icon: 'bi bi-envelope-paper', colorClass: 'text-primary' },
          { title: 'Total Pending Verifications', value: summary.total_pending || 0, icon: 'bi bi-hourglass-split', colorClass: 'text-primary' },
          { title: 'Total Completed Requests', value: summary.total_completed || 0, icon: 'bi bi-patch-check', colorClass: 'text-primary' },
          { title: 'Total Rejected', value: summary.total_rejected || 0, icon: 'bi bi-x-octagon', colorClass: 'text-primary' }
        ];
        this.loading = false;
      });
  }

  private fetchCombinedRequests() {
    const mapItemToRecord = (item: any, requestTypeOverride?: string) => {
      const user = item.user || {};

      const firstName = user.first_name || item.user_first_name || item.first_name || '';
      const lastName = user.last_name || item.user_last_name || item.last_name || '';

      let studentName = (firstName + ' ' + lastName).trim();
      if (!studentName && (user.username || item.user_username)) {
        studentName = user.username || item.user_username;
      } else if (!studentName) {
        studentName = 'N/A';
      }

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
        studentName = 'N/A';
      }

      let program = item.programme || item.user_program || user.program || user.department || 'N/A';
      if (requestTypeOverride === 'provisional' && item.programme) {
        program = item.programme;
      }

      return {
        ...item,
        id: item.id,
        request_type: requestTypeOverride || item.request_type,
        student_name: studentName.trim(),
        program: program,
        submitted_at: this.isValidDate(item.submitted_at) ? new Date(item.submitted_at) : new Date(0),
        hod_verified: item.hod_verified,
        bursar_verified: item.bursar_verified,
        exam_officer_verified: item.exam_officer_approved,
        user_id: user.id || item.user
      };
    };

    const transcriptRequests$ = this.http.get<any[]>(this.apiEndpoints.transcriptCertificateRequests)
      .pipe(
        map(data => data.map(item => mapItemToRecord(item))),
        catchError(() => of([]))
      );

    const provisionalRequests$ = this.http.get<any[]>(this.apiEndpoints.provisionalRequests)
      .pipe(
        map(data => data.map(item => mapItemToRecord(item, 'provisional'))),
        catchError(() => of([]))
      );

    return forkJoin([transcriptRequests$, provisionalRequests$]).pipe(
      map(([transcriptRequests, provisionalRequests]) => {
        const combined = [...transcriptRequests, ...provisionalRequests];
        // Deduplicate if necessary
        return combined.filter((record, index, self) =>
          index === self.findIndex((r) => (
            r.id === record.id && r.request_type === record.request_type
          ))
        );
      })
    );
  }

  private processExamOfficerData(requests: any[]) {
    const totalRequests = requests.length;
    const totalVerified = requests.filter(r => r.exam_officer_verified).length;
    const certificatesReady = requests.filter(r => r.hod_verified && r.bursar_verified && r.exam_officer_verified);

    this.studentSummaryCards = [
      { title: 'Total Requests', value: totalRequests, icon: 'bi bi-journal-text', colorClass: 'text-primary' },
      { title: 'Total Verified', value: totalVerified, icon: 'bi bi-check-circle', colorClass: 'text-success' },
      { title: 'Certificates Ready', value: certificatesReady.length, icon: 'bi bi-file-earmark-check', colorClass: 'text-primary' }
    ];
    this.loading = false;
  }

  getFormattedDate(): string {
    const date = new Date();
    const dayName = this.datePipe.transform(date, 'EEEE');
    const day = date.getDate();
    const month = this.datePipe.transform(date, 'MMMM');
    const year = date.getFullYear();
    const getOrdinal = (n: number): string => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `<strong>${dayName}</strong>, ${month} ${day}<sup>${getOrdinal(day)}</sup>, ${year}`;

  }

  fetchStudentDashboardData(userId: number): void {
    const apiUrl = `${this.apiEndpoints.transcriptCertificateRequests}?user=${userId}`;
    console.log('fetchStudentDashboardData: Fetching student requests from URL:', apiUrl);

    const requestsSub = this.http.get<TranscriptRequestItem[]>(apiUrl)
      .pipe(
        map(requests => {
          console.log(`fetchStudentDashboardData: Received ${requests.length} requests for student ID ${userId}.`);

          const totalRequests = requests.length;
          const readyCount = requests.filter(
            req => req.hod_verified && req.bursar_verified && req.exam_officer_approved
          ).length;

          // Re-read the user object from AuthService just before determining biometric status for the card
          // This ensures we get the latest state after checkBiometricRegistration has potentially updated it.
          const currentUser = this.authService.getUser();
          console.log('fetchStudentDashboardData: Current user object from AuthService before determining biometric status:', currentUser);
          const biometricStatus = currentUser?.biometric_setup_complete === true ? 'Registered' : 'Pending';
          console.log('fetchStudentDashboardData: Determined Biometric Status for card:', biometricStatus);

          return { totalRequests, readyCount, biometricStatus };
        }),
        catchError(error => {
          console.error(`fetchStudentDashboardData: Error fetching student transcript/certificate requests for user ${userId}:`, error);
          // Default to pending if there's an error fetching requests or checking biometric
          const currentUser = this.authService.getUser(); // Try to get the latest user even on error
          const biometricStatus = currentUser?.biometric_setup_complete === true ? 'Registered' : 'Pending';
          console.log('fetchStudentDashboardData: Determined Biometric Status for card (on error):', biometricStatus);
          return of({ totalRequests: 0, readyCount: 0, biometricStatus: biometricStatus });
        })
      )
      .subscribe(data => {
        this.studentSummaryCards = [
          { title: 'My Requests', value: data.totalRequests, icon: 'bi bi-journal-text', colorClass: 'text-primary' },
          { title: 'Certificates Ready', value: data.readyCount, icon: 'bi bi-file-earmark-check', colorClass: 'text-primary' },
          { title: 'Biometric Status', value: data.biometricStatus, icon: 'bi bi-fingerprint', colorClass: 'text-primary' }
        ];

        this.loading = false; // Hide preloader
      });
    this.subscriptions.add(requestsSub);
  }

  saveStudentProfile(form: NgForm): void {
    if (!this.user) return;

    const updatedData = {
      department: form.value.department,
      program: form.value.program
    };

    this.http.put(`${this.apiEndpoints.users}${this.user.id}/`, updatedData).subscribe({
      next: () => {
        Swal.fire('Success', 'Profile updated successfully', 'success');
        // Optionally update local user data
        if (this.user) {
          this.user.department = updatedData.department;
          this.user.program = updatedData.program;
        }
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        Swal.fire('Error', 'Failed to update profile', 'error');
      }
    });

  }

  fetchHodDashboardData(): void {
    const summarySub = this.http.get<any>(this.apiEndpoints.hodSummary)
      .pipe(catchError(() => of({ classes: 0, departments: 0, students: 0 })))
      .subscribe(summary => {
        this.hodSummaryCards = [
          { title: 'Classes Managed', value: summary.classes || 0, icon: 'bi bi-easel', colorClass: 'text-success' },
          { title: 'Departments Overseen', value: summary.departments || 0, icon: 'bi bi-building', colorClass: 'text-success' },
          { title: 'Total Students in Depts', value: summary.students || 0, icon: 'bi bi-people', colorClass: 'text-success' }
        ];
        this.loading = false; // Hide preloader
      });
    this.subscriptions.add(summarySub);

    const verificationSub = this.http.get<TranscriptRequestItem[]>(`${this.apiEndpoints.hodPendingRequests}?hod_verified=false&exam_officer_approved=false`)
      .pipe(
        map(requests => requests.map((req): TableRow => {
          let studentName = 'N/A';
          let studentProgram = 'N/A';
          if (typeof req.user === 'object' && req.user !== null) {
            studentName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.username || 'Unknown User';
            studentProgram = req.user.department || 'N/A';
          } else if (req.user) {
            studentName = `User ID: ${req.user}`;
          }
          return {
            id: req.id,
            student: studentName,
            course: studentProgram,
            request_type: req.request_type,
            date: this.datePipe.transform(req.submitted_at, 'mediumDate') || 'N/A',
          };
        })),
        catchError((err) => {
          console.error("Error fetching HOD verification list:", err);
          return of([]);
        })
      )
      .subscribe(data => {
        this.hodVerificationRequests = data;
      });
    this.subscriptions.add(verificationSub);
    if (this.requestChartCanvas?.nativeElement) this.renderChart();
  }

  fetchBursarDashboardData(): void {
    const summarySub = this.http.get<any>(this.apiEndpoints.bursarSummary)
      .pipe(catchError(() => of({ all_requests: 0, pending_bursar: 0, completed_by_bursar: 0, rejected_by_bursar: 0 })))
      .subscribe(summary => {
        this.bursarSummaryCards = [
          { title: 'All Financial Requests', value: summary.all_requests || 0, icon: 'bi bi-envelope', colorClass: 'text-primary' },
          { title: 'Pending My Verification', value: summary.pending_bursar || 0, icon: 'bi bi-clock-history', colorClass: 'text-primary' },
          { title: 'Verified by Me', value: summary.completed_by_bursar || 0, icon: 'bi bi-check-circle', colorClass: 'text-primary' },
          { title: 'Rejected by Me', value: summary.rejected_by_bursar || 0, icon: 'bi bi-x-circle', colorClass: 'text-primary' }
        ];
        this.loading = false; // Hide preloader
      });
    this.subscriptions.add(summarySub);

    const financialsSub = this.http.get<any[]>(`${this.apiEndpoints.bursarVerifiedFinancials}?bursar_verified=true&limit=10`)
      .pipe(
        map(records => records.map((rec): TableRow => {
          let studentName = 'N/A';
          if (typeof rec.user === 'object' && rec.user !== null) {
            studentName = `${rec.user.first_name || ''} ${rec.user.last_name || ''}`.trim() || rec.user.username || 'Unknown';
          } else if (rec.student_name) {
            studentName = rec.student_name;
          } else if (rec.user_id || rec.user) {
            studentName = `User ID: ${rec.user_id || rec.user}`;
          }
          return {
            student: studentName,
            amount: this.datePipe.transform(rec.amount_paid || rec.amount, 'currency', 'USD', 'symbol') || '$0.00',
            date: this.datePipe.transform(rec.payment_date || rec.date, 'mediumDate') || 'N/A'
          };
        })),
        catchError((err) => {
          console.error("Error fetching bursar financials:", err);
          return of([]);
        })
      )
      .subscribe(data => {
        this.bursarVerifiedFinancials = data;
      });
    this.subscriptions.add(financialsSub);
    if (this.requestChartCanvas?.nativeElement) this.renderChart();
  }

  fetchAdminDashboardData(): void {
    const adminSummarySub = this.http.get<any>(this.apiEndpoints.adminSummary)
      .pipe(catchError(() => of({
        total_classes: 0, total_departments: 0, total_students: 0,
        total_requests: 0, total_pending: 0, total_completed: 0, total_rejected: 0
      })))
      .subscribe(summary => {
        this.adminHodLikeCards = [
          { title: 'Total Classes', value: summary.total_classes || 0, icon: 'bi bi-easel', colorClass: 'text-success' },
          { title: 'Total Departments', value: summary.total_departments || 0, icon: 'bi bi-building', colorClass: 'text-success' },
          { title: 'Total Students', value: summary.total_students || 0, icon: 'bi bi-people', colorClass: 'text-success' }
        ];
        this.adminBursarLikeCards = [
          { title: 'Total System Requests', value: summary.total_requests || 0, icon: 'bi bi-envelope-paper', colorClass: 'text-primary' },
          { title: 'Total Pending Verifications', value: summary.total_pending || 0, icon: 'bi bi-hourglass-split', colorClass: 'text-primary' },
          { title: 'Total Completed Requests', value: summary.total_completed || 0, icon: 'bi bi-patch-check', colorClass: 'text-primary' },
          { title: 'Total Rejected', value: summary.total_rejected || 0, icon: 'bi bi-x-octagon', colorClass: 'text-primary' }
        ];
        this.loading = false; // Hide preloader
      });
    this.subscriptions.add(adminSummarySub);
    if (this.requestChartCanvas?.nativeElement) this.renderChart();
  }

  renderChart(): void {
    if (!this.requestChartCanvas || !this.requestChartCanvas.nativeElement) {
      console.warn('Chart canvas not ready for rendering in renderChart.');
      if (document.readyState === "complete") {
        setTimeout(() => this.renderChart(), 100);
      }
      return;
    }
    const ctx = this.requestChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get chart context');
      return;
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.http.get<{ labels: string[], data: number[] }>(`${this.apiEndpoints.requestTrendsChart}?filter=${this.filterBy}`)
      .pipe(catchError(() => of({ labels: ['No Data Available'], data: [0] })))
      .subscribe(chartData => {
        this.chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels.length > 0 ? chartData.labels : ['N/A'],
            datasets: [{
              label: 'Requests',
              data: chartData.data.length > 0 ? chartData.data : [0],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#eaecef' } },
              x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#eaecef' } }
            },
            plugins: { legend: { labels: { color: '#eaecef' } } }
          }
        });
      });
  }

  onFilterByChange(): void {
    if (this.currentUserRole && !['student'].includes(this.currentUserRole)) {
      this.renderChart();
    }

  }

}

