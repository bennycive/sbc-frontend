import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'], // optional
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class LoginComponent {
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

    this.http.post<any>('http://localhost:8000/api/token/', loginData).subscribe({

      next: (res) => {


        console.log('Access Token:', res.access);   // log access token
        console.log('Refresh Token:', res.refresh); // log refresh token

        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        this.router.navigate(['/admin']);



      },
      error: (err) => {
        this.loginError = 'Invalid username or password.';
      }

    });

  }


}


