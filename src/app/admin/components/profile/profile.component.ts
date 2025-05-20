import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
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

  enableEdit(): void {
    this.isReadonly = false;
    this.disabled = false;
  }

  // save(): void {
  //   const token = this.authService.getToken();

  //   if (!this.profile || !this.profile.user || !token) return;

  //   const formData = new FormData();
  //   formData.append('user', this.profile.user.toString());
  //   formData.append('yos', this.profile.yos || '');
  //   formData.append('nida', this.profile.nida || '');
  //   formData.append('phone_number', this.profile.phone_number || '');
  //   formData.append('department', this.profile.department || '');
  //   formData.append('program', this.profile.program || '');

  //   if (this.selectedFile) {
  //     formData.append('image', this.selectedFile);
  //   }

  //   const headers = {
  //     headers: new HttpHeaders({
  //       'Authorization': `Bearer ${token}`
  //     })
  //   };

  //   console.log('Profile ID before save:', this.profile.id); // Debug log

  //   const request$ = this.profile.id
  //     ? this.http.put(`http://127.0.0.1:8000/api/users/profiles/${this.profile.id}/`, formData, headers)
  //     : this.http.post('http://127.0.0.1:8000/api/users/profiles/', formData, headers);

  //   request$.subscribe({
  //     next: () => {
  //       Swal.fire({
  //         icon: 'success',
  //         title: 'Profile Saved',
  //         text: 'Your profile has been successfully updated!',
  //         confirmButtonColor: '#3085d6',
  //         confirmButtonText: 'OK'
  //       });
  //       this.isReadonly = true;
  //       this.disabled = true;
  //     },
  //     error: (err) => {
  //       console.error('Save failed', err);
  //       Swal.fire('Error', 'Failed to save profile', 'error');
  //     }
  //   });
  // }

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
      },
      error: (err) => {
        console.error('Save failed', err);
        Swal.fire('Error', 'Failed to save profile', 'error');
      }
    });
  }


  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }
}
