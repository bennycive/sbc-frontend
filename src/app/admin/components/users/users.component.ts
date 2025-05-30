import { Component } from '@angular/core';
import {
  ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PLATFORM_ID, Inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

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
  users: any[] = [];
  filteredUsers: any[] = [];
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
    this.http.put(`${environment.apiBaseUrl}/users/users/${this.selectedUserId}/`, data).subscribe(
      () => {
        Swal.fire('Updated!', 'User updated successfully.', 'success');
        this.resetForm();
        this.loadUsers();
        this.selectedUserId = null;
        this.editingIndex = null;
      },
      error => this.handleFormError(error, 'updating')
    );
  }

  createUser(data: any) {
    this.http.post(`${environment.apiBaseUrl}/users/users/`, data).subscribe(
      () => {
        Swal.fire('Registered!', 'New user registered successfully.', 'success');
        this.resetForm();
        this.loadUsers();
      },
      error => this.handleFormError(error, 'registering')
    );
  }

  handleFormError(error: any, action: string) {
    if (error.status === 400 && error.error) {
      let errorMessages = '';
      for (const key in error.error) {
        const messages = error.error[key];
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => errorMessages += `${msg}<br>`);
        } else {
          errorMessages += `${messages}<br>`;
        }
      }
      Swal.fire({ icon: 'error', title: 'Validation Error', html: errorMessages });
    } else {
      Swal.fire('Error', `Unexpected error occurred while ${action} the user.`, 'error');
    }
  }

  resetForm() {
    this.userForm.reset();
    this.selectedUserId = null;
    this.editingIndex = null;
    this.passwordStrength = '';
  }

  loadUsers() {
    this.http.get<any[]>(`${environment.apiBaseUrl}/users/users/`).subscribe(data => {
      this.users = data;
      this.filteredUsers = data;
    });
  }

  onEdit(index: number) {
    const user = this.filteredUsers[index];
    this.editingIndex = index;
    this.selectedUserId = user.id;

    this.userForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.department,
      is_active: user.is_active,
    });
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
        this.http.delete(`${environment.apiBaseUrl}/users/users/${user.id}/`).subscribe(() => {
          this.loadUsers();
          Swal.fire('Deleted!', 'User has been deleted.', 'success');
        });
      }
    });
  }

  generatePdfReport() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['#', 'Name', 'Username', 'Email', 'Role', 'Department']],
      body: this.filteredUsers.map((u, i) => [
        i + 1,
        `${u.first_name} ${u.last_name}`,
        u.username,
        u.email,
        u.role,
        u.department
      ]),
    });
    doc.save('user_report.pdf');
  }


}


