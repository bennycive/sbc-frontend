import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private baseUrl = 'http://127.0.0.1:8000/api/colleges/departments/';

  constructor(private http: HttpClient) { }

  getDepartments(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  addDepartment(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateDepartment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}${id}/`, data);
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }
}
