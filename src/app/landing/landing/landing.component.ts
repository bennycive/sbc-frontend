import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FooterComponent } from "../components/footer/footer.component";
import { HeaderComponent } from "../components/header/header.component";
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FooterComponent,

  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],



})

export class LandingComponent {

  @ViewChild('carousel', { static: false }) carousel!: ElementRef;


  scrollLeft() {
    this.carousel.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    this.carousel.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
  }

  currentUserRole: '' | 'student' | 'hod' | 'bursar' | 'admin' = '';

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



  services = [
    {
      title: 'Certificate Request',
      description: 'Request for your graduation or completion certificate.',
      icon: 'bi bi-file-earmark-text'
    },
    {
      title: 'Online Clearance',
      description: 'Submit clearance forms digitally for approvals.',
      icon: 'bi bi-check-circle'
    },
    {
      title: 'Transcript Request',
      description: 'Get your academic transcripts processed online.',
      icon: 'bi bi-journal-text'
    },
    {
      title: 'Professional Result Request',
      description: 'Request verified professional exam results.',
      icon: 'bi bi-award'
    },
    {
      title: 'Track Requests',
      description: 'Monitor the status of all your submitted requests.',
      icon: 'bi bi-search'
    },
    {
      title: 'Bimetric Verification',
      description: 'Biometric verifications requests.',
      icon: 'bi bi-fingerprint'
    }





  ];





}

