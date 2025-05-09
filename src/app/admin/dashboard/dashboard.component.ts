import { CommonModule } from '@angular/common';
import { Component,EventEmitter, Output  } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  currentUserRole: string = 'admin'; 

  filterBy: string = 'daily';

  formattedDate: string = '';
  user: any = null;

  constructor(private router: Router, private authService: AuthService) {
    this.user = this.authService.getUser();

  }


  ngOnInit(): void {
    this.formattedDate = this.getFormattedDate();
    this.user = this.authService.getUser();
  }



  @Output() toggleSidebar = new EventEmitter<void>();



  getFormattedDate(): string {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
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

    return `${dayName} ${day}<sup>${getOrdinal(day)}</sup> of ${month}, ${year}`;

  }


  studentCards = [
    { icon: 'fas fa-graduation-cap', title: 'Total Requests', value: '15' },
    { icon: 'fas fa-file-alt', title: 'Pending Requests', value: '5' },
    { icon: 'fas fa-check', title: 'Approved Requests', value: '10' }
  ];

  hodCards = [
    { icon: 'fas fa-users', title: 'Total Students', value: '150' },
    { icon: 'fas fa-chalkboard-teacher', title: 'Courses Offered', value: '12' }
  ];

  bursarCards = [
    { icon: 'fas fa-wallet', title: 'Total Financials', value: '$50,000' },
    { icon: 'fas fa-credit-card', title: 'Pending Payments', value: '$2,000' }
  ];

  transcriptRequests = [
    { requestId: 'TR123', date: '2025-05-05', purpose: 'Graduation', status: 'Approved' },
    { requestId: 'TR124', date: '2025-05-06', purpose: 'Job Application', status: 'Pending' }
  ];

  certificateCollections = [
    { certificateId: 'C123', date: '2025-05-05', type: 'Degree', status: 'Collected' },
    { certificateId: 'C124', date: '2025-05-06', type: 'Transcript', status: 'Pending' }
  ];

  verifiedRecords = [
    { student: 'John Doe', course: 'Computer Science', date: '2025-05-05' }
  ];

  verifiedFinancials = [
    { student: 'Jane Doe', amount: '$500', date: '2025-05-05' }
  ];

  recentActivities = [
    { id: '1', user: 'Admin', status: 'Active', statusClass: 'success', date: '2025-05-05' },
    { id: '2', user: 'John Doe', status: 'Inactive', statusClass: 'danger', date: '2025-05-06' }
  ];



}
