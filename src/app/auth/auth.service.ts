// auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/token/';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { username: string; password: string }) {
    return this.http.post(this.apiUrl, credentials);
  }


  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }


}
