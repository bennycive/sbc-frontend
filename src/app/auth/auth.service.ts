
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({

  providedIn: 'root'

})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/token/'; // adjust as needed

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post(this.apiUrl, { username, password });
  }

  saveUserData(token: string, refresh: string, user: any) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  

  getToken() {
    return localStorage.getItem('access_token');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }


}


