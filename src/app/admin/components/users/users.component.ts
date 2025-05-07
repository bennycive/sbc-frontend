import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';  // Ensure this line is included

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent {
  userForm: FormGroup;
  roles: string[] = ['student', 'staff'];
  departments: string[] = ['Engineering', 'Science', 'Business', 'Arts'];
  users: any[] = [];
  filteredUsers: any[] = [];
  filterRole: string = '';
  filterDepartment: string = '';
  editingIndex: number | null = null;

  // Adding title and logo variables
  title: string = 'THE UNIVERSITY OF DODOMA';
  logoUrl: string = 'assets/logo/udom_logo2.png';  // Path to your logo image

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      role: ['', Validators.required],
      department: ['', Validators.required],
      registrationNumber: [''],
      level: [''],
      program: [''],
      faculty: [''],
      employeeId: [''],
      designation: [''],
    });
  }

  get f() {
    return this.userForm.controls;
  }

  onSubmit() {
    if (this.userForm.invalid) {
      return;
    }

    if (this.editingIndex !== null) {
      // Update existing user
      this.users[this.editingIndex] = this.userForm.value;
      Swal.fire('Updated!', 'User information updated successfully.', 'success');
    } else {
      // Register new user
      this.users.push(this.userForm.value);
      Swal.fire('Registered!', 'New user registered successfully.', 'success');
    }

    this.resetForm();
    this.filterUsers();
  }

  onEdit(index: number) {
    this.editingIndex = index;
    this.userForm.patchValue(this.users[index]);
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


  generatePdfReport() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoUrl = 'assets/logo/udom_logo2.png';
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      const now = new Date();
      const printedAt = `Printed at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('en-GB')}`;

      // Add logo
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
        user.firstName + ' ' + user.lastName,
        user.email,
        user.role,
        user.department,
        user.phone,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Name', 'Email', 'Role', 'Department', 'Phone']],
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

          // Left: printed time
          doc.text(printedAt, 14, footerY);

          // Center: Page x of y
          

          // Right: U number of page
          doc.text('Udom', pageWidth - 14, footerY, { align: 'center' });
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
    this.editingIndex = null;
  }
}
