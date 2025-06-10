import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  currentUserRole: '' | 'student' | 'hod' | 'bursar' | 'admin' = '';
  profile: any = {};
  isReadonly = true;
  disabled = true;
  selectedFile: File | null = null;

  departments: any[] = [];
  courses: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private courseService: CourseService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    const token = this.authService.getToken();

    if (!user || !token) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserRole = user.role || '';
    this.fetchProfile(user.id, token);
    this.loadDepartments();
    this.loadCourses();
  }

  fetchProfile(userId: number, token: string): void {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://127.0.0.1:8000/api/users/profiles/', { headers }).subscribe({
      next: (profiles) => {
        const existingProfile = profiles.find(p => p.user === userId);
        console.log('Fetched profile:', existingProfile);
        if (existingProfile) {
          // Ensure the ID is preserved
          this.profile = existingProfile;
        } else {
          this.profile = {
            user: userId,
            yos: '',
            nida: '',
            phone_number: '',
            department: '',
            program: '',
            image: ''
          };
        }
      },
      error: (err) => {
        console.error('Failed to fetch profile:', err);
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data;
      },
      error: (err: any) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data: any) => {
        this.courses = data;
      },
      error: (err: any) => {
        console.error('Error loading courses:', err);
      }
    });
  }

  enableEdit(): void {
    this.isReadonly = false;
    this.disabled = false;
  }

  save(): void {
    const token = this.authService.getToken();
    if (!this.profile || !this.profile.user || !token) return;

    const formData = new FormData();
    formData.append('user', this.profile.user.toString());
    formData.append('nida', this.profile.nida || '');
    formData.append('phone_number', this.profile.phone_number || '');

    // Append based on role
    if (this.currentUserRole === 'student') {
      formData.append('yos', this.profile.yos || '');
      formData.append('program', this.profile.program || '');
    }

    if (this.currentUserRole !== 'admin') {
      formData.append('department', this.profile.department || '');
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const headers = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };

    const request$ = this.profile.id
      ? this.http.put(`http://127.0.0.1:8000/api/users/profiles/${this.profile.id}/`, formData, headers)
      : this.http.post('http://127.0.0.1:8000/api/users/profiles/', formData, headers);

    request$.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Profile Saved',
          text: 'Your profile has been successfully updated!',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
        this.isReadonly = true;
        this.disabled = true;
        // Re-fetch profile to update UI
        this.fetchProfile(this.profile.user, token);
        // Re-fetch profile to update UI
        this.fetchProfile(this.profile.user, token);
      },
      error: (err) => {
        console.error('Save failed', err);
        Swal.fire('Error', 'Failed to save profile', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Invalid File', 'Only JPG, PNG, or GIF files are allowed.', 'error');
      this.selectedFile = null;
      return;
    }
    // Validate file size (max 800KB)
    const maxSize = 800 * 1024;
    if (file.size > maxSize) {
      Swal.fire('File Too Large', 'Maximum file size is 800KB.', 'error');
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  // Helper to get department name by id
  getDepartmentName(deptId: any): string {
    const dept = this.departments.find(d => d.id === deptId);
    return dept ? dept.name : '';
  }

  get programName(): string {
    return this.profile.program ? this.courses.find(c => c.id == this.profile.program)?.name || '' : '';
  }
}
