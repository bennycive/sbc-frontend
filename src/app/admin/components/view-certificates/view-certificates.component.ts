import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Certificate {
  id: number;
  certificate_name: string;
  certificate_type: string;
  uploaded_at: string;
  certificate_file: string;
  certificate_file_url: string; // We will assign it ourselves
}

@Component({
  selector: 'app-view-certificates',
  templateUrl: './view-certificates.component.html',
  styleUrls: ['./view-certificates.component.css'],
  imports: [CommonModule],
})
export class ViewCertificatesComponent implements OnInit {
  certificates: Certificate[] = [];
  previewCert: Certificate | null = null;
  apiUrl = 'http://127.0.0.1:8000/api/users';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.fetchCertificates();
  }

  fetchCertificates() {
    this.http.get<any[]>(`${this.apiUrl}/certificates/`).subscribe({
      next: (data) => {
        this.certificates = data.map(cert => ({
          ...cert,
          certificate_file_url: cert.certificate_file, // 👈 Fix here
        }));
      },
      error: (err) => console.error('Failed to fetch certificates', err),
    });
  }

  openPreview(cert: Certificate) {
    console.log('Previewing URL:', cert.certificate_file_url);
    this.previewCert = cert;
  }

  closePreview() {
    this.previewCert = null;
  }

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|png)$/i.test(url);
  }

  isPDF(url: string): boolean {
    return /\.pdf$/i.test(url);
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }



  

}
