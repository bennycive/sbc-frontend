// In: src/app/components/login/login.component.ts

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
// 1. IMPORT YOUR AUTH SERVICE
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // 2. INJECT THE AUTH SERVICE
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    // 3. USE THE SERVICE
    this.authService.login(username, password).subscribe({
      next: (res: any) => {
        // 4. LET THE SERVICE SAVE THE DATA
        // Make sure res.access matches your API response (e.g., res.token)
        this.authService.saveUserData(res.access, res.refresh, res.user);

        // 5. NAVIGATE
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loginError = 'Invalid username or password.';
      }
    });
  }
}
