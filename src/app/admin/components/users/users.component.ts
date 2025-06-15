import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../../environments/environment';

// FIX 1: Correct relative path to the asset from this component's location


// Define a User interface for type safety
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  department: string;
  is_active: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent {
  userForm: FormGroup;
  roles: string[] = ['student', 'admin', 'hod', 'bursar', 'exam-officer'];
  departments: string[] = ['ICT', 'CSE', 'ETE', 'IST'];

  users: User[] = [];
  filteredUsers: User[] = [];

  selectedUserId: number | null = null;
  editingIndex: number | null = null;
  passwordStrength: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, @Inject(PLATFORM_ID) private platformId: any) {
    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      role: ['', Validators.required],
      department: ['', Validators.required],
      password: ['', [Validators.required, this.passwordStrengthValidator()]],
      is_active: [false],
    });
  }

  ngOnInit() {
    this.loadUsers();

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(async () => {
        const jQuery = (await import('jquery')).default;
        (window as any).$ = (window as any).jQuery = jQuery;
        await import('datatables.net');
        await import('datatables.net-bs5');
        jQuery(() => jQuery('#example').DataTable());
      }, 0);
    }
  }

  get f() {
    return this.userForm.controls;
  }

  checkPasswordStrength() {
    const password = this.f['password'].value;
    const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=])[A-Za-z\\d!@#$%^&*()_+\\-=]{8,}$');
    const mediumRegex = new RegExp('^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[A-Z])(?=.*\\d))|((?=.*[a-z])(?=.*\\d)))[A-Za-z\\d!@#$%^&*()_+\\-=]{6,}$');

    if (strongRegex.test(password)) {
      this.passwordStrength = 'Strong';
    } else if (mediumRegex.test(password)) {
      this.passwordStrength = 'Medium';
    } else {
      this.passwordStrength = 'Weak';
    }
  }

  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.value;
      const strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      return strongPattern.test(password) ? null : { weakPassword: true };
    };
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    const formData = this.cleanFormData(this.userForm.value);

    if (this.selectedUserId) {
      this.updateUser(formData);
    } else {
      this.createUser(formData);
    }
  }

  cleanFormData(data: any): any {
    const cleanedData: any = {};
    for (const key in data) {
      cleanedData[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    }
    return cleanedData;
  }

  updateUser(data: any) {
    this.http.put(`<span class="math-inline">\{environment\.apiBaseUrl\}/users/users/</span>{this.selectedUserId}/`, data).subscribe({
      next: () => {
        Swal.fire('Updated!', 'User updated successfully.', 'success');
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => this.handleFormError(err, 'updating')
    });
  }

  createUser(data: any) {
    this.http.post(`${environment.apiBaseUrl}/users/users/`, data).subscribe({
      next: () => {
        Swal.fire('Registered!', 'New user registered successfully.', 'success');
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => this.handleFormError(err, 'registering')
    });
  }

  handleFormError(error: any, action: string) {
    if (error.status === 400 && error.error) {
      let errorMessages = '';
      for (const key in error.error) {
        const messages = error.error[key];
        errorMessages += Array.isArray(messages) ? `${messages.join('<br>')}<br>` : `${messages}<br>`;
      }
      Swal.fire({ icon: 'error', title: 'Validation Error', html: errorMessages });
    } else {
      Swal.fire('Error', `Unexpected error occurred while ${action} the user.`, 'error');
    }
  }

  resetForm() {
    this.userForm.reset({ is_active: false });
    this.selectedUserId = null;
    this.editingIndex = null;
    this.passwordStrength = '';
  }

  loadUsers() {
    this.http.get<User[]>(`${environment.apiBaseUrl}/users/users/`).subscribe(data => {
      this.users = data;
      this.filteredUsers = data;
    });
  }

  onEdit(index: number) {
    const user = this.filteredUsers[index];
    this.editingIndex = index;
    this.selectedUserId = user.id;

    this.userForm.patchValue(user);
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onDelete(index: number) {
    const user = this.filteredUsers[index];
    Swal.fire({
      title: 'Are you sure?',
      text: 'User will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then(result => {
      if (result.isConfirmed) {
        // FIX 2: Corrected the typo from apiBase_url to apiBaseUrl
        this.http.delete(`<span class="math-inline">\{environment\.apiBaseUrl\}/users/users/</span>{user.id}/`).subscribe(() => {
          this.loadUsers();
          Swal.fire('Deleted!', 'User has been deleted.', 'success');
        });
      }
    });
  }


  generatePdfReport() {
    const doc = new jsPDF();

    const logoPath = 'assets/logo/udom_logo2.png';
    const logoWidth = 30;
    const logoHeight = 30;
    // The logoPath variable from the import statement is used here
    doc.addImage(logoPath, 'PNG', 15, 10, logoWidth, logoHeight);


    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('THE UNIVERSITY OF DODOMA', pageWidth / 2, 20, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('TRANSCRIPT AND CERTIFICATE COLLECTION SYSTEM', pageWidth / 2, 28, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('USER REPORT', pageWidth / 2, 38, { align: 'center' });

    // --- Add Generated Time ---
    const generatedTime = new Date().toLocaleString(); // e.g., "6/15/2025, 1:46:29 AM"
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100);

    const reportMargin = 15;
    doc.text(`Generated on: ${generatedTime}`, pageWidth - reportMargin, 46, { align: 'right' });


    // --- Table Section ---
    autoTable(doc, {
      startY: 50,
      head: [['Name', 'Username', 'Email', 'Role', 'Department']],
      body: this.filteredUsers.map(u => [
        `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        u.username,
        u.email,
        u.role,
        u.department,
      ]),
      theme: 'grid',
      styles: {
        font: 'times',
      },
      headStyles: {
        fillColor: [2, 37, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },

    });

    // --- Footer with Double Line and Page Numbers ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setLineWidth(0.2);
      doc.setDrawColor(150);
      doc.line(reportMargin, pageHeight - 16, pageWidth - reportMargin, pageHeight - 16);
      doc.line(reportMargin, pageHeight - 15, pageWidth - reportMargin, pageHeight - 15);

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150);

      const text = `Page ${i} of ${pageCount}`;
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, pageHeight - 10);
    }


    doc.save('user_report.pdf');

  }



}
