import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class CourseService {
  private baseUrl = 'http://127.0.0.1:8000/api/colleges/department/courses/';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  addCourse(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateCourse(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}${id}/`, data);
  }

  deleteCourse(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }
}
