import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CollegeService {
  private baseUrl = 'http://127.0.0.1:8000/api/colleges/colleges/';

  constructor(private http: HttpClient) {}

  getColleges(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  addCollege(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateCollege(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}${id}/`, data);
  }

  deleteCollege(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }

}

