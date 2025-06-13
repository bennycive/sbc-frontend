import { Inject, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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
  fingerprintImage: string | null = null;
  fingerprintData: string | null = null; // Will store the JSON string of the WebAuthn response
  isScanning: boolean = false;
  fingerprintFailed: boolean = false;
  fingerprintCaptured: boolean = false;

  showSecurityQuestions: boolean = false;

  // This array is the single source of truth for selected questions and their answers.
  selectedQuestions: { question: string; answer: string }[] = [];

  allQuestions: string[] = [
    'What is your mother’s maiden name?',
    'What was the name of your first pet?',
    'What is your favorite food?',
    'Where were you born?',
    'What is your favorite color?',
    'What is your childhood nickname?'
  ];

  constructor(
    private http: HttpClient,
    @Inject(AuthService) private authService: AuthService,
    private webauthnService: WebauthnService // Injected WebAuthn service
  ) {}

  /**
   * Simulates fingerprint capture for testing purposes.
   */
  simulateCaptureFingerprint() {
    this.fingerprintImage = 'https://via.placeholder.com/120x120.png?text=Fingerprint';
    this.fingerprintData = '{"id":"SIMULATED_ID","rawId":"SIMULATED_RAW_ID","type":"public-key","response":{}}'; // Example JSON data
    this.fingerprintStatus = 'Fingerprint Captured Successfully';
    this.fingerprintCaptured = true;
    this.showSecurityQuestions = true;
  }

  /**
   * Initiates the WebAuthn registration process.
   */
  async captureFingerprint() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.fingerprintFailed = false;
    this.fingerprintStatus = 'Registering fingerprint... Please follow the browser prompt.';

    try {
      const registrationResponse = await this.webauthnService.register();

      if (!registrationResponse) {
        this.isScanning = false;
        this.fingerprintStatus = 'Fingerprint Registration Cancelled';
        this.fingerprintFailed = true;
        Swal.fire('Cancelled', 'Fingerprint registration was cancelled.', 'info');
        return;
      }

      this.fingerprintData = JSON.stringify(registrationResponse);

      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registered Successfully';
      this.fingerprintCaptured = true;
      this.showSecurityQuestions = true;
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
   * Toggles a security question in the selected list.
   */
  toggleQuestionSelection(question: string) {
    const existingQuestion = this.selectedQuestions.find(q => q.question === question);

    if (existingQuestion) {
      this.selectedQuestions = this.selectedQuestions.filter(q => q.question !== question);
    } else {
      if (this.selectedQuestions.length >= 3) {
        Swal.fire('Limit Reached', 'You can only select up to 3 questions.', 'warning');
        return;
      }
      this.selectedQuestions.push({ question, answer: '' });
    }
  }

  /**
   * Checks if a question is currently selected. Used to manage the checkbox state.
   */
  isQuestionSelected(question: string): boolean {
    return this.selectedQuestions.some(q => q.question === question);
  }

  /**
   * Checks if the form is ready for submission (exactly 3 questions selected with answers).
   */
  canSubmitAnswers(): boolean {
    return (
      this.selectedQuestions.length === 3 &&
      this.selectedQuestions.every(q => q.answer && q.answer.trim() !== '')
    );
  }

  /**
   * Submits the selected security questions and their encrypted answers to the backend.
   */
  submitAnswers() {
    if (!this.canSubmitAnswers()) {
      Swal.fire('Error', 'Please select exactly 3 questions and provide an answer for each.', 'error');
      return;
    }

    const user = this.authService.getUser();
    if (!user || !user.id) {
        console.error('User ID is missing.');
        Swal.fire('Error', 'Could not identify user. Please log in again.', 'error');
        return;
    }

    const payload = {
      student: user.id,
      security_questions: this.selectedQuestions.map(q => ({
        question: q.question,
        encryptedAnswer: CryptoJS.AES.encrypt(q.answer.trim(), 'secret-key').toString()
      }))
    };

    this.http.post(`http://localhost:8000/users_api/security_questions/`, payload)
      .subscribe({
        next: (response) => {
          console.log('Security questions submitted successfully:', response);
          Swal.fire('Success', 'Security questions saved successfully.', 'success');
        },
        error: (error) => {
          console.error('Error sending security questions:', error);
          Swal.fire('Error', 'Failed to save security questions.', 'error');
        }
      });
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

    this.http.post(`http://localhost:8000/fingerprints/`, {
      student: user.id,
      fingerprint_data: this.fingerprintData // Sending the clean JSON string
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

  /**
   * Skips the biometric setup process.
   */
  skipBiometric() {
    console.log('Biometric setup skipped');
  }
  
}
