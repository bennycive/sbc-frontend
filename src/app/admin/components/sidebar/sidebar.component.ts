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

  currentUserRole: '' | 'exam-officer' | 'student' | 'hod' | 'bursar' | 'admin' | 'admin' = '';

  user: any = null;

  constructor(private router: Router, private authService: AuthService) {
    this.user = this.authService.getUser();
  }

  ngOnInit(): void {

    this.user = this.authService.getUser();
    this.currentUserRole = this.user?.role || '';

  }

  logout() {

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);

  }

  //  profile informations for all users
  profile() {

    this.router.navigate(['/dashbord/profile']);

  }

  // Request all academic cerificates
  requestAcademicCertificates() {
    this.router.navigate(['/dashbord/certificates-requests']);
  }

  //  add the ids
  addCertificateAndIds() {
    this.router.navigate(['/dashbord/certificates-and-ids-list']);
  }

  //  add users
  registerUsers() {
    this.router.navigate(['/dashbord/users']);
  }


  // biometric setup
  biometricSetup() {
    this.router.navigate(['dashbord/biometric-setups'])
  }

  //  financial verification
  financiaVerification() {
    this.router.navigate(['/dashbord/financial-verifications'])
  }

  verifyRecords() {

    this.router.navigate(['/dashbord/verify-records'])

  }

  ExamOfficerverifyRecords(){
    this.router.navigate(['/dashbord/exam-officer-verify'])
  }

  financiaRecords() {
    this.router.navigate(['/dashbord/financial-records'])
  }

  collage() {
    this.router.navigate(['/dashbord/collage'])
  }


  viewCertificateAndIds() {
    this.router.navigate(['/dashbord/view-certificates'])
  }



}


