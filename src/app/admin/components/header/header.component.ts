import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent {

  currentUserRole: '' | 'student' | 'hod' | 'bursar' | 'admin' | 'admin'='';

  formattedDate: string = '';
  user: any = null;

  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(private router: Router, private authService: AuthService) {
    this.user = this.authService.getUser();
  }

  ngOnInit(): void {
   this.user = this.authService.getUser();
   this.currentUserRole = this.user?.role || '';
  }



  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']);
  }


  toggleSidebarMenu(): void {
    this.toggleSidebar.emit();
  }

}
