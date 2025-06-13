import { Inject, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { WebauthnService } from '../../../services/webauthn.service';

/**
 * Helper function to convert ArrayBuffer to a Base64URL-encoded string.
 * This is a critical step for making WebAuthn credential data JSON-serializable.
 */
function bufferToBase64URL(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

@Component({
  selector: 'app-biometric-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './biometric-setup.component.html',
  styleUrls: ['./biometric-setup.component.css']
})
export class BiometricSetupComponent {
  fingerprintStatus: string = 'Not Captured';
  fingerprintImage: string | null = null;
  fingerprintData: string | null = null; // Will store the JSON string of the WebAuthn response
  isScanning: boolean = false;
  fingerprintFailed: boolean = false;
  fingerprintCaptured: boolean = false;

  constructor(
    private http: HttpClient,
    @Inject(AuthService) private authService: AuthService,
    private webauthnService: WebauthnService
  ) {}

  /**
   * Initiates the WebAuthn registration process.
   */
  async captureFingerprint() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.fingerprintFailed = false;
    this.fingerprintStatus = 'Registering fingerprint... Please follow the browser prompt.';

    try {
      // *** DEFINITIVE FIX ***
      // We call the service's register method, assuming it returns the raw credential object
      // from the `navigator.credentials.create()` call.
      const credential = await this.webauthnService.register() as PublicKeyCredential;

      if (!credential) {
        // This case handles when the user cancels the browser prompt or the service returns null.
        this.isScanning = false;
        this.fingerprintStatus = 'Fingerprint Registration Cancelled';
        this.fingerprintFailed = true;
        Swal.fire('Cancelled', 'Fingerprint registration was cancelled.', 'info');
        return;
      }

      // Manually create a JSON-safe object by converting all ArrayBuffers from the credential to Base64URL strings.
      // This is the crucial step that prevents the "Illegal invocation" error.
      const registrationResponse = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        response: {
          attestationObject: bufferToBase64URL((credential.response as AuthenticatorAttestationResponse).attestationObject),
          clientDataJSON: bufferToBase64URL((credential.response as AuthenticatorAttestationResponse).clientDataJSON),
        },
        type: credential.type,
      };

      // Now that registrationResponse is a clean, JSON-safe object, we can safely stringify it.
      this.fingerprintData = JSON.stringify(registrationResponse);

      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registered Successfully';
      this.fingerprintCaptured = true;
      Swal.fire('Success', 'Fingerprint registered successfully.', 'success');

    } catch (error) {
      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registration Failed';
      this.fingerprintFailed = true;
      console.error('WebAuthn registration error:', error);
      Swal.fire('Error', 'Fingerprint registration failed. This could be due to a timeout, cancellation, or an unsupported device. Please try again.', 'error');
    }
  }

  /**
   * Submits the captured biometric data to the server.
   */
  submitBiometric() {
    if (!this.fingerprintData) {
      Swal.fire('Error', 'Please capture your fingerprint before submitting.', 'error');
      return;
    }

    const user = this.authService.getUser();
    if (!user || !user.id) {
      console.error('User ID is missing.');
      Swal.fire('Error', 'User ID is missing or fingerprint data is missing.', 'error');
      return;
    }

    // Parse the JSON string to an object before sending to avoid Illegal invocation error
    let fingerprintPayload;
    try {
      fingerprintPayload = JSON.parse(this.fingerprintData);
    } catch (e) {
      console.error('Failed to parse fingerprintData JSON:', e);
      Swal.fire('Error', 'Invalid fingerprint data format.', 'error');
      return;
    }

    this.http.post(`http://localhost:8000/fingerprints/`, {
      student: user.id,
      fingerprint_data: fingerprintPayload
    }).subscribe({
      next: (response) => {
        console.log('Fingerprint data sent successfully:', response);
        Swal.fire('Success', 'Fingerprint data saved successfully.', 'success');
      },
      error: (error) => {
        console.error('Error sending fingerprint data:', error);
        const errorMessage = error.error?.detail || 'Failed to save fingerprint data.';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }
}
