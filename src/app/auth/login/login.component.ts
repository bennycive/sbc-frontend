import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ]

})

export class LoginComponent {


  currentUserRole: '' | 'student' | 'exam-officer' | 'hod' | 'bursar' | 'admin' = '';

  loginForm: FormGroup;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.loginForm.invalid) return;

    const loginData = this.loginForm.value;



    this.http.post<any>(`${environment.apiBaseUrl}/token/`, loginData).subscribe({
      next: (res) => {

        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserRole = res.user.role;
        this.router.navigate(['/dashbord']);


      },
      error: (err) => {
        this.loginError = 'Invalid username or password.';
      }

    });

  }


}

