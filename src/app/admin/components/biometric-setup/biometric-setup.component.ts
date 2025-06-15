import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { WebauthnService } from '../../../services/webauthn.service';

@Component({
  selector: 'app-biometric-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './biometric-setup.component.html',
  styleUrls: ['./biometric-setup.component.css']
})
export class BiometricSetupComponent {
  fingerprintStatus: string = 'Not Captured';
  isScanning: boolean = false;
  fingerprintFailed: boolean = false;
  fingerprintCaptured: boolean = false;

  // Add fingerprintImage property to avoid template errors
  fingerprintImage: string | null = null;  // Can assign placeholder image if you want

  constructor(
    @Inject(AuthService) private authService: AuthService,
    private webauthnService: WebauthnService
  ) {}

  async captureFingerprint() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.fingerprintFailed = false;
    this.fingerprintStatus = 'Registering fingerprint... Please follow the browser prompt.';

    try {
      // Call the service's register() that performs the full flow and completes registration
      await this.webauthnService.register();

      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registered Successfully';
      this.fingerprintCaptured = true;

      // Since WebAuthn doesn’t provide a fingerprint image, set a placeholder or null
      this.fingerprintImage = null;

      Swal.fire('Success', 'Fingerprint registered successfully.', 'success');

    } catch (error) {
      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registration Failed';
      this.fingerprintFailed = true;
      console.error('WebAuthn registration error:', error);
      Swal.fire('Error', 'Fingerprint registration failed. Please try again.', 'error');
    }
  }
}
