import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface Course {
  name: string;
  semester: string;
  classLevel: string;
}

interface Department {
  name: string;
  courses: Course[];
}

interface College {
  name: string;
  departments: Department[];
}

@Component({
  selector: 'app-collage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collage.component.html',
  styleUrls: ['./collage.component.css']
})
export class CollageComponent {
  colleges: College[] = [];

  collegeName = '';
  departmentName = '';
  courseName = '';
  semester = '';
  classLevel = '';

  selectedCollegeIndex: number | null = null;
  selectedDepartmentIndex: number | null = null;

  selectCollege(index: number) {
    this.selectedCollegeIndex = index;
    this.selectedDepartmentIndex = null;
  }

  selectDepartment(index: number) {
    this.selectedDepartmentIndex = index;
  }

  addCollege() {
    if (!this.collegeName.trim()) return;
    this.colleges.push({ name: this.collegeName.trim(), departments: [] });
    Swal.fire('Success', 'College added successfully!', 'success');
    this.collegeName = '';
  }

  updateCollege(index: number) {
    Swal.fire({
      title: 'Update College Name',
      input: 'text',
      inputValue: this.colleges[index].name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        this.colleges[index].name = result.value.trim();
        Swal.fire('Updated', 'College name updated successfully.', 'success');
      }
    });
  }

  deleteCollege(index: number) {
    Swal.fire({
      title: 'Delete College?',
      text: 'This will delete the college and its departments!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.colleges.splice(index, 1);
        if (this.selectedCollegeIndex === index) this.selectedCollegeIndex = null;
        Swal.fire('Deleted!', 'College has been deleted.', 'success');
      }
    });
  }

  addDepartment() {
    if (this.selectedCollegeIndex === null || !this.departmentName.trim()) return;
    this.colleges[this.selectedCollegeIndex].departments.push({
      name: this.departmentName.trim(),
      courses: []
    });
    Swal.fire('Success', 'Department added successfully!', 'success');
    this.departmentName = '';
  }

  updateDepartment(index: number) {
    const department = this.colleges[this.selectedCollegeIndex!].departments[index];
    Swal.fire({
      title: 'Update Department Name',
      input: 'text',
      inputValue: department.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        department.name = result.value.trim();
        Swal.fire('Updated', 'Department name updated successfully.', 'success');
      }
    });
  }

  deleteDepartment(index: number) {
    Swal.fire({
      title: 'Delete Department?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed && this.selectedCollegeIndex !== null) {
        this.colleges[this.selectedCollegeIndex].departments.splice(index, 1);
        if (this.selectedDepartmentIndex === index) this.selectedDepartmentIndex = null;
        Swal.fire('Deleted!', 'Department has been deleted.', 'success');
      }
    });
  }

  addCourse() {
    if (
      this.selectedCollegeIndex === null ||
      this.selectedDepartmentIndex === null ||
      !this.courseName.trim() || !this.semester || !this.classLevel
    ) return;

    this.colleges[this.selectedCollegeIndex]
      .departments[this.selectedDepartmentIndex]
      .courses.push({
        name: this.courseName.trim(),
        semester: this.semester,
        classLevel: this.classLevel
      });

    Swal.fire('Success', 'Course added successfully!', 'success');
    this.courseName = '';
    this.semester = '';
    this.classLevel = '';
  }

  updateCourse(index: number) {
    const course = this.colleges[this.selectedCollegeIndex!]
      .departments[this.selectedDepartmentIndex!].courses[index];

    Swal.fire({
      title: 'Update Course Name',
      input: 'text',
      inputValue: course.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        course.name = result.value.trim();
        Swal.fire('Updated', 'Course updated successfully.', 'success');
      }
    });
  }

  deleteCourse(index: number) {
    Swal.fire({
      title: 'Delete Course?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.colleges[this.selectedCollegeIndex!]
          .departments[this.selectedDepartmentIndex!]
          .courses.splice(index, 1);
        Swal.fire('Deleted!', 'Course deleted successfully.', 'success');
      }
    });
  }
}
