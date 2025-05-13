import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';  // Ensure this line is included
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';



@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent {




  serverErrors: string[] = [];

  selectedUserId: number | null = null;
  editingIndex: number | null = null;



  userForm: FormGroup;
  roles: string[] = ['student', 'admin', 'hod', 'bursar', 'exam-officer'];
  departments: string[] = ['ICT', 'CSE', 'ETE', 'IST'];
  users: any[] = [];
  filteredUsers: any[] = [];
  filterRole: string = '';
  filterDepartment: string = '';



  constructor(private fb: FormBuilder, private http: HttpClient, @Inject(PLATFORM_ID) private platformId: any) {
    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      role: ['', Validators.required],
      department: ['', Validators.required],
      password:['', Validators.required],
      is_active: [false],

    });

  }


  get f() {
    return this.userForm.controls;
  }

  ngOnInit() {
    this.loadUsers();

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(async () => {
        const jQuery = (await import('jquery')).default;
        (window as any).$ = (window as any).jQuery = jQuery;
        await import('datatables.net');
        await import('datatables.net-bs5');

        jQuery(function () {
          jQuery('#example').DataTable();
        });
      }, 0);
    }
  }


  loadUsers() {

    this.http.get<any[]>(`${environment.apiBaseUrl}/users/users/`).subscribe(data => {
      this.users = data;
      this.filterUsers();
    });

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
    if (data.hasOwnProperty(key)) {
      cleanedData[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    }
  }
  return cleanedData;
}

updateUser(data: any) {
  this.http.put(`${environment.apiBaseUrl}/users/users/${this.selectedUserId}/`, data).subscribe(
    response => {
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
    response => {
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
      if (error.error.hasOwnProperty(key)) {
        const messages = error.error[key];
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            errorMessages += `${msg}<br>`;
          });
        } else {
          errorMessages += `${messages}<br>`;
        }
      }
    }

    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      html: errorMessages
    });
  } else {
    Swal.fire('Error', `Unexpected error occurred while ${action} the user.`, 'error');
  }
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
      password: user.password,
      department: user.department,
      is_active: user.is_active,

    });


  }


  onDelete(index: number) {
    this.users.splice(index, 1);
    this.filterUsers();
    Swal.fire('Deleted!', 'User deleted successfully.', 'success');
  }

  onFilterSubmit() {
    this.filterUsers();
  }

  onFilterDepartmentChange() {
    this.filterUsers();
  }

  filterUsers() {
    let tempUsers = [...this.users];

    if (this.filterRole) {
      tempUsers = tempUsers.filter(user => user.role === this.filterRole);
    }

    if (this.filterDepartment) {
      tempUsers = tempUsers.filter(user => user.department === this.filterDepartment);
    }

    this.filteredUsers = tempUsers;
  }

  //  REPORT GENERATION PART
  title: string = 'THE UNIVERSITY OF DODOMA';
  logoUrl: string = 'assets/logo/udom_logo2.png';

  generatePdfReport() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const img = new Image();
    img.src = this.logoUrl;

    img.onload = () => {
      const now = new Date();
      const printedAt = `Printed at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('en-GB')}`;

      doc.addImage(img, 'PNG', 14, 10, 25, 25);
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      const centerX = pageWidth / 2;

      const heading1 = 'THE UNIVERSITY OF DODOMA';
      const heading2 = 'TRANSCRIPT AND CERTIFICATE COLLECTION SYSTEM';

      let reportType = '';
      if (this.filterRole === 'student') {
        reportType = 'STUDENT REPORT';
      } else if (this.filterRole === 'staff') {
        reportType = 'STAFF REPORT';
      } else {
        reportType = 'USER REPORT';
      }

      doc.text(heading1.toUpperCase(), centerX, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      doc.text(heading2.toUpperCase(), centerX, 25, { align: 'center' });
      doc.setFont('times', 'bold');
      doc.text(reportType.toUpperCase(), centerX, 32, { align: 'center' });

      const tableData = this.filteredUsers.map(user => [
        user.first_name + ' ' + user.last_name,
        user.username,
        user.email,
        user.role,
        user.department,
        user.phone,

      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Name', 'Username', 'Email', 'Role', 'Department']],
        body: tableData,
        styles: {
          font: 'times',
          fontSize: 10,
          halign: 'left',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        theme: 'grid',
        didDrawPage: (data) => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const footerY = pageHeight - 10;

          const printedAt = `Printed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${new Date().toLocaleDateString('en-GB')}`;

          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          doc.text(printedAt, 14, footerY);
          doc.text('UDOM', pageWidth - 14, footerY, { align: 'center' });
          doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, pageWidth / 2, footerY, { align: 'right' });
        }
      });

      doc.save(`${reportType.toLowerCase().replace(' ', '_')}.pdf`);
    };

    img.onerror = () => {
      Swal.fire('Error', 'Failed to load logo image.', 'error');
    };
  }



  resetForm() {
    this.userForm.reset();
    this.selectedUserId = null;
    this.editingIndex = null;
  }



}
