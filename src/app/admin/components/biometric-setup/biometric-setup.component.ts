import { Inject, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { WebauthnService } from '../../../services/webauthn.service';

function bufferToBase64URL(buffer: ArrayBuffer): string {
  const fromCharCode = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(fromCharCode)
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
  fingerprintData: string | null = null;
  isScanning: boolean = false;
  fingerprintFailed: boolean = false;
  fingerprintCaptured: boolean = false;

  showSecurityQuestions: boolean = false;

  selectedQuestions: { question: string; answer: string }[] = [];
  allQuestions: string[] = [
    'What is your mother’s maiden name?',
    'What was the name of your first pet?',
    'What is your favorite food?',
    'Where were you born?',
    'What is your favorite color?',
    'What is your childhood nickname?'
  ];

  answers: { [key: string]: string } = {};

  constructor(
    private http: HttpClient,
    @Inject(AuthService) private authService: AuthService,
    private webauthnService: WebauthnService
  ) {}

  simulateCaptureFingerprint() {
    this.fingerprintImage = 'https://via.placeholder.com/120x120.png?text=Fingerprint';
    this.fingerprintData = 'SAMPLE_FINGERPRINT_HASH_DATA';
    this.fingerprintStatus = 'Fingerprint Captured Successfully';
    this.fingerprintCaptured = true;
    this.showSecurityQuestions = true;
  }

  async captureFingerprint() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.fingerprintStatus = 'Registering fingerprint...';

    try {
      const rawCredential = await this.webauthnService.register();

      if (!rawCredential) {
        this.isScanning = false;
        this.fingerprintStatus = 'Fingerprint Registration Cancelled';
        this.fingerprintFailed = true;
        Swal.fire('Cancelled', 'Fingerprint registration was cancelled.', 'info');
        return;
      }

      const credential = rawCredential as PublicKeyCredential;
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;

      const registrationPayload = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64URL(attestationResponse.clientDataJSON),
          attestationObject: bufferToBase64URL(attestationResponse.attestationObject),
        },
      };

      this.fingerprintData = JSON.stringify(registrationPayload);

      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registered Successfully';
      this.fingerprintCaptured = true;
      this.showSecurityQuestions = true;
      Swal.fire('Success', 'Fingerprint registered successfully.', 'success');

    } catch (error) {
      this.isScanning = false;
      this.fingerprintStatus = 'Fingerprint Registration Failed';
      this.fingerprintFailed = true;
      Swal.fire('Error', 'Fingerprint registration failed. Please try again.', 'error');
      console.error('WebAuthn registration error:', error);
    }
  }

  toggleQuestionSelection(question: string) {
    if (this.selectedQuestions.find(q => q.question === question)) {
      this.selectedQuestions = this.selectedQuestions.filter(q => q.question !== question);
    } else {
      if (this.selectedQuestions.length >= 3) {
        Swal.fire('Limit Reached', 'You can only select up to 3 questions.', 'warning');
        return;
      }
      this.selectedQuestions.push({ question, answer: '' });
    }
  }

  updateAnswer(question: string, answer: string) {
    const q = this.selectedQuestions.find(q => q.question === question);
    if (q) q.answer = answer;
  }

  removeQuestion(question: string) {
    this.selectedQuestions = this.selectedQuestions.filter(q => q.question !== question);
  }

  isQuestionSelected(question: string): boolean {
    return this.selectedQuestions.some(q => q.question === question);
  }

  onQuestionSelect(event: Event) {
    const selectedOptions = Array.from((event.target as HTMLSelectElement).selectedOptions);
    this.selectedQuestions = selectedOptions.map((option: HTMLOptionElement) => ({
      question: option.value,
      answer: ''
    }));
  }

  canSubmitAnswers(): boolean {
    return (
      this.selectedQuestions.length >= 3 &&
      this.selectedQuestions.every(q => this.answers[q.question]?.trim() !== '')
    );
  }

  submitAnswers() {
    if (this.selectedQuestions.length < 3) {
      Swal.fire('Error', 'Select at least 3 questions.', 'error');
      return;
    }

    const encryptedAnswers = this.selectedQuestions.map(q => ({
      question: q.question,
      encryptedAnswer: CryptoJS.AES.encrypt(q.answer.trim(), 'secret-key').toString()
    }));

    console.log('Encrypted answers submitted:', encryptedAnswers);
    Swal.fire('Success', 'Security answers submitted successfully.', 'success');

    const user = this.authService.getUser();
    if (user && user.id && this.selectedQuestions.length > 0) {
      const question = this.selectedQuestions[0].question;
      const answer = this.answers[question];
      const encryptedAnswer = CryptoJS.AES.encrypt(answer.trim(), 'secret-key').toString();

      this.http.post(`http://localhost:8000/users_api/security_questions/`, {
        student: user.id,
        security_questions: [{ question: question, encryptedAnswer: encryptedAnswer }]
      }).subscribe({
        next: (response) => {
          console.log('Security question submitted successfully:', response);
          Swal.fire('Success', 'Security question submitted successfully.', 'success');
          this.selectedQuestions.shift();
          delete this.answers[question];
        },
        error: (error) => {
          console.error('Error sending security question:', error);
          Swal.fire('Error', 'Failed to save security question.', 'error');
        }
      });
    } else {
      console.error('User ID is missing or no questions selected.');
      Swal.fire('Error', 'User ID is missing or no questions selected.');
    }
  }

  submitBiometric() {
    if (!this.fingerprintData) {
      Swal.fire('Error', 'Please capture fingerprint before submitting.', 'error');
      return;
    }

    console.log('Sending fingerprint data to server:', this.fingerprintData);
    Swal.fire('Submitted', 'Fingerprint data submitted successfully.', 'success');

    const user = this.authService.getUser();
    if (user && user.id && this.fingerprintData) {
      this.http.post(`http://localhost:8000/fingerprints/`, {
        student: user.id,
        fingerprint_data: this.fingerprintData
      }).subscribe({
        next: (response) => {
          console.log('Fingerprint data sent successfully:', response);
          Swal.fire('Success', 'Fingerprint data saved successfully.', 'success');
        },
        error: (error) => {
          console.error('Error sending fingerprint data:', error);
          Swal.fire('Error', 'Failed to save fingerprint data.', 'error');
        }
      });
    } else {
      console.error('User ID or fingerprint data is missing.');
      Swal.fire('Error', 'User ID or fingerprint data is missing.');
    }
  }

  skipBiometric() {
    console.log('Biometric setup skipped');
  }
}
