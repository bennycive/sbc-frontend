import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Example in your component.ts
currentUserRole: ''| 'student' | 'hod' | 'bursar' | 'admin' = 'admin';

constructor(private router: Router) {}

logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  this.router.navigate(['/auth/login']);
 }

}

