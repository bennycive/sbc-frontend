import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { CollegeService } from '../../../services/college.service';

interface Course {
  id?: number;
  name: string;
  semester: string;
  classLevel: string;
}

interface Department {
  id?: number;
  name: string;
  courses: Course[];
}

interface College {
  id?: number;
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
export class CollageComponent implements OnInit {
  colleges: College[] = [];
  collegeName = '';
  departmentName = '';
  courseName = '';
  semester = '';
  classLevel = '';

  selectedCollegeIndex: number | null = null;
  selectedDepartmentIndex: number | null = null;

  constructor(
    private collegeService: CollegeService,
    private departmentService: DepartmentService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadColleges();
  }

  loadColleges() {
    this.collegeService.getColleges().subscribe(data => this.colleges = data);
  }

  selectCollege(index: number) {
    this.selectedCollegeIndex = index;
    this.selectedDepartmentIndex = null;
  }

  selectDepartment(index: number) {
    this.selectedDepartmentIndex = index;
  }

  addCollege() {
    if (!this.collegeName.trim()) return;
    this.collegeService.addCollege({ name: this.collegeName.trim() }).subscribe(() => {
      Swal.fire('Success', 'College added successfully!', 'success');
      this.collegeName = '';
      this.loadColleges();
    });
  }

  updateCollege(index: number) {
    const college = this.colleges[index];
    Swal.fire({
      title: 'Update College Name',
      input: 'text',
      inputValue: college.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        this.collegeService.updateCollege(college.id!, { name: result.value.trim() }).subscribe(() => {
          Swal.fire('Updated', 'College updated successfully!', 'success');
          this.loadColleges();
        });
      }
    });
  }

  deleteCollege(index: number) {
    const college = this.colleges[index];
    Swal.fire({
      title: 'Delete College?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.collegeService.deleteCollege(college.id!).subscribe(() => {
          Swal.fire('Deleted!', 'College has been deleted.', 'success');
          this.loadColleges();
        });
      }
    });
  }

  addDepartment() {
    if (this.selectedCollegeIndex === null || !this.departmentName.trim()) return;
    const college = this.colleges[this.selectedCollegeIndex];
    this.departmentService.addDepartment({ name: this.departmentName.trim(), college: college.id }).subscribe(() => {
      Swal.fire('Success', 'Department added successfully!', 'success');
      this.departmentName = '';
      this.loadColleges();
    });
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
        this.departmentService.updateDepartment(department.id!, { name: result.value.trim() }).subscribe(() => {
          Swal.fire('Updated', 'Department updated successfully!', 'success');
          this.loadColleges();
        });
      }
    });
  }

  deleteDepartment(index: number) {
    const department = this.colleges[this.selectedCollegeIndex!].departments[index];
    Swal.fire({
      title: 'Delete Department?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.departmentService.deleteDepartment(department.id!).subscribe(() => {
          Swal.fire('Deleted!', 'Department has been deleted.', 'success');
          this.loadColleges();
        });
      }
    });
  }

  addCourse() {
    if (this.selectedCollegeIndex === null || this.selectedDepartmentIndex === null ||
        !this.courseName.trim() || !this.semester || !this.classLevel) return;

    const department = this.colleges[this.selectedCollegeIndex].departments[this.selectedDepartmentIndex];
    this.courseService.addCourse({
      name: this.courseName.trim(),
      semester: this.semester,
      class_level: this.classLevel,
      department: department.id
    }).subscribe(() => {
      Swal.fire('Success', 'Course added successfully!', 'success');
      this.courseName = '';
      this.semester = '';
      this.classLevel = '';
      this.loadColleges();
    });
  }

  updateCourse(index: number) {
    const course = this.colleges[this.selectedCollegeIndex!].departments[this.selectedDepartmentIndex!].courses[index];
    Swal.fire({
      title: 'Update Course Name',
      input: 'text',
      inputValue: course.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        this.courseService.updateCourse(course.id!, { name: result.value.trim() }).subscribe(() => {
          Swal.fire('Updated', 'Course updated successfully!', 'success');
          this.loadColleges();
        });
      }
    });
  }

  deleteCourse(index: number) {
    const course = this.colleges[this.selectedCollegeIndex!].departments[this.selectedDepartmentIndex!].courses[index];
    Swal.fire({
      title: 'Delete Course?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.courseService.deleteCourse(course.id!).subscribe(() => {
          Swal.fire('Deleted!', 'Course deleted successfully.', 'success');
          this.loadColleges();
        });
      }
    });
  }
}
