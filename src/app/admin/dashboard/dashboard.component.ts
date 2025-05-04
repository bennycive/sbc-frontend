import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  currentUserRole: 'student' | 'hod' | 'bursar' | 'admin' = 'bursar';

  //  dashboard contents
  summaryCards = [
    { title: 'Certificates', value: 120, icon: 'bi bi-file-earmark-text' },
    { title: 'Transcripts', value: 98, icon: 'bi bi-journal-text' },
    { title: 'Clearances', value: 45, icon: 'bi bi-check-circle' },
    { title: 'Biometric Logs', value: 320, icon: 'bi bi-fingerprint' }
  ];

  recentRequests = [
    { student: 'John Doe', type: 'Transcript', status: 'Approved', date: '2025-05-01' },
    { student: 'Jane Smith', type: 'Clearance', status: 'Pending', date: '2025-04-30' },
    { student: 'Mike Brian', type: 'Certificate', status: 'Rejected', date: '2025-04-28' }
  ];


  verifiedRecords = [
    { student: 'John Doe', course: 'BSc CS', date: '2025-05-03' },
    { student: 'Jane Smith', course: 'BSc IT', date: '2025-04-30' }
  ];


  verifiedFinancials = [
    { student: 'Jane Smith', amount: 45000, date: '2025-04-29' },
    { student: 'Ali Hassan', amount: 30000, date: '2025-04-27' },
    { student: 'Aisha John', amount: 50000, date: '2025-04-25' }
  ];

  transcriptRequests = [
    { requestId: 101, date: '2025-04-01', purpose: 'Job Application', status: 'Pending' },
    { requestId: 102, date: '2025-04-02', purpose: 'Further Study', status: 'Approved' }
  ];

  certificateCollections = [
    { certificateId: 201, date: '2025-04-03', type: 'Degree Certificate', status: 'Ready' },
    { certificateId: 202, date: '2025-04-05', type: 'Diploma', status: 'Processing' }
  ];



   // Cards count for bursar
   financialSummary = {
    pending: 4,
    completed: 7,
    rejected: 1
  };

  // Chart data (simulated)
  filterBy: string = 'monthly';

  selectedFilter = 'month'; // can be 'month', 'year', 'daily'
  chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Requests',
        data: [5, 7, 3, 6, 4],
        backgroundColor: '#0d6efd'
      }
    ]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  };


}
