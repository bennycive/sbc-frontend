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
      // Add logo (left) with some spacing from top
      doc.addImage(img, 'PNG', 14, 10, 25, 25); // 25x25 size, adjust if needed
  
      // Set Times New Roman (or closest equivalent)
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
  
      const centerX = pageWidth / 2;
  
      // Headings
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
  
      // Draw centered heading (below the logo height + a bit of padding)
      doc.text(heading1.toUpperCase(), centerX, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      doc.text(heading2.toUpperCase(), centerX, 25, { align: 'center' });
      doc.setFont('times', 'bold');
      doc.text(reportType.toUpperCase(), centerX, 32, { align: 'center' });
  
      // Prepare table data
      const tableData = this.filteredUsers.map(user => [
        user.firstName + ' ' + user.lastName,
        user.email,
        user.role,
        user.department,
        user.phone,
      ]);
  
      // Create table without background color and with borders
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
          lineColor: [0, 0, 0], // Black border
        },
        headStyles: {
          fillColor: [255, 255, 255], // White background
          textColor: [0, 0, 0],       // Black text
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        theme: 'grid', // Adds borders
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
