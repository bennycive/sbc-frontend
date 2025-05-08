import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-biometric-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './biometric-setup.component.html',
  styleUrls: ['./biometric-setup.component.css']
})
export class BiometricSetupComponent {
  fingerprintStatus: string = 'Not Captured';
  fingerprintImage: string | null = null;
  fingerprintData: string | null = null;
  isScanning: boolean = false;
  fingerprintFailed: boolean = false;

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

  constructor() {}

  // Capture fingerprint method
  captureFingerprint() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.fingerprintStatus = 'Capturing...';

    setTimeout(() => {
      const success = Math.random() > 0.3; 

      if (success) {
        this.fingerprintImage = 'https://via.placeholder.com/120x120.png?text=Fingerprint';
        this.fingerprintData = 'SAMPLE_FINGERPRINT_HASH_DATA';
        this.fingerprintStatus = 'Fingerprint Captured Successfully';
      } else {
        this.fingerprintStatus = 'Fingerprint Mismatch. Please answer security questions.';
        this.fingerprintFailed = true;
      }

      this.isScanning = false;
    }, 2000);
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
  
    // Map selected options to objects with question and empty answer
    this.selectedQuestions = selectedOptions.map((option: HTMLOptionElement) => ({
      question: option.value, // The question is the value of the option
      answer: ''              // Initially, the answer is empty
    }));
  }
  


  // Check if answers are ready to submit
  canSubmitAnswers(): boolean {
    return this.selectedQuestions.length >= 3 && 
           this.selectedQuestions.every(q => q.answer.trim() !== '');
  }

  // Submit answers method
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
  }

  submitBiometric() {
    if (!this.fingerprintData) {
      Swal.fire('Error', 'Please capture fingerprint before submitting.', 'error');
      return;
    }

    console.log('Sending fingerprint data to server:', this.fingerprintData);
    Swal.fire('Submitted', 'Fingerprint data submitted successfully.', 'success');
  }

  skipBiometric() {
    console.log('Biometric setup skipped');
  }
}
