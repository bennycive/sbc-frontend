import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';




@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
 
  currentUserRole: '' | 'student' | 'hod' | 'bursar' | 'admin' | 'admin'='admin';

  user: any = null;

constructor(private router: Router,private authService: AuthService) {
  this.user = this.authService.getUser();
}

ngOnInit(): void {
  this.user = this.authService.getUser();
  // this.currentUserRole = this.user?.role || '';

}

logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  this.router.navigate(['/auth/login']);
}

//  profile informations for all users 
profile(){
  this.router.navigate(['/dashbord/profile']);

  
}

// Request all academic cerificates 
requestAcademicCertificates(){
  this.router.navigate(['/dashbord/certificates-requests']);
}

//  add the ids 
addCertificateAndIds(){
  this.router.navigate(['/dashbord/certificates-and-ids-list']);
}


registerUsers()
{
  this.router.navigate(['/dashbord/users']);
}


}


