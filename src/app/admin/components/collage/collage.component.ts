import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { CollegeService } from '../../../services/college.service';
import { PreloaderComponent } from "../preloader/preloader.component";

interface Course {
  id?: number;
  name: string;
  semester: string;
  class_level: string;
  department?: number;
}

interface Department {
  id?: number;
  name: string;
  college?: number;
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
  imports: [CommonModule, FormsModule, PreloaderComponent],
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

  loading: boolean = false;

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
    this.loading = true;
    this.collegeService.getColleges().subscribe({
      next: (data) => {
        this.colleges = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading colleges:', error);
        Swal.fire('Error', 'Failed to load colleges', 'error');
        this.loading = false;
      }
    });
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
    this.collegeService.addCollege({ name: this.collegeName.trim() }).subscribe({
      next: () => {
        Swal.fire('Success', 'College added successfully!', 'success');
        this.collegeName = '';
        this.loadColleges();
      },
      error: (error) => {
        console.error('Error adding college:', error);
        Swal.fire('Error', 'Failed to add college', 'error');
      }
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
        this.collegeService.updateCollege(college.id!, { name: result.value.trim() }).subscribe({
          next: () => {
            Swal.fire('Updated', 'College updated successfully!', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error updating college:', error);
            Swal.fire('Error', 'Failed to update college', 'error');
          }
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
        this.collegeService.deleteCollege(college.id!).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'College has been deleted.', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error deleting college:', error);
            Swal.fire('Error', 'Failed to delete college', 'error');
          }
        });
      }
    });
  }

  addDepartment() {
    if (this.selectedCollegeIndex === null || !this.departmentName.trim()) return;
    const college = this.colleges[this.selectedCollegeIndex];
    this.departmentService.addDepartment({
      name: this.departmentName.trim(),
      college: college.id
    }).subscribe({
      next: () => {
        Swal.fire('Success', 'Department added successfully!', 'success');
        this.departmentName = '';
        this.loadColleges();
      },
      error: (error) => {
        console.error('Error adding department:', error);
        Swal.fire('Error', 'Failed to add department', 'error');
      }
    });
  }

  updateDepartment(index: number) {
    if (this.selectedCollegeIndex === null) return;
    const college = this.colleges[this.selectedCollegeIndex];
    const department = college.departments[index];

    Swal.fire({
      title: 'Update Department Name',
      input: 'text',
      inputValue: department.name,
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then(result => {
      if (result.isConfirmed && result.value.trim()) {
        this.departmentService.updateDepartment(department.id!, {
          name: result.value.trim(),
          college: college.id
        }).subscribe({
          next: () => {
            Swal.fire('Updated', 'Department updated successfully!', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error updating department:', error);
            Swal.fire('Error', 'Failed to update department', 'error');
          }
        });
      }
    });
  }

  deleteDepartment(index: number) {
    if (this.selectedCollegeIndex === null) return;
    const department = this.colleges[this.selectedCollegeIndex].departments[index];

    Swal.fire({
      title: 'Delete Department?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.departmentService.deleteDepartment(department.id!).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Department has been deleted.', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            Swal.fire('Error', 'Failed to delete department', 'error');
          }
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
    }).subscribe({
      next: () => {
        Swal.fire('Success', 'Course added successfully!', 'success');
        this.courseName = '';
        this.semester = '';
        this.classLevel = '';
        this.loadColleges();
      },
      error: (error) => {
        console.error('Error adding course:', error);
        Swal.fire('Error', 'Failed to add course', 'error');
      }
    });
  }

  updateCourse(index: number) {
    if (this.selectedCollegeIndex === null || this.selectedDepartmentIndex === null) return;

    const department = this.colleges[this.selectedCollegeIndex].departments[this.selectedDepartmentIndex];
    const course = department.courses[index];

    Swal.fire({
      title: 'Update Course',
      html: `
        <input id="courseName" class="swal2-input" placeholder="Course Name" value="${course.name}">
        <select id="semester" class="swal2-input">
          <option value="1" ${course.semester === '1' ? 'selected' : ''}>Semester 1</option>
          <option value="2" ${course.semester === '2' ? 'selected' : ''}>Semester 2</option>
        </select>
        <select id="classLevel" class="swal2-input">
          <option value="1" ${course.class_level === '1' ? 'selected' : ''}>First Year</option>
          <option value="2" ${course.class_level === '2' ? 'selected' : ''}>Second Year</option>
          <option value="3" ${course.class_level === '3' ? 'selected' : ''}>Third Year</option>
          <option value="4" ${course.class_level === '4' ? 'selected' : ''}>Fourth Year</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const courseName = (document.getElementById('courseName') as HTMLInputElement).value;
        const semester = (document.getElementById('semester') as HTMLSelectElement).value;
        const classLevel = (document.getElementById('classLevel') as HTMLSelectElement).value;

        if (!courseName.trim()) {
          Swal.showValidationMessage('Course name is required');
          return false;
        }

        return { courseName: courseName.trim(), semester, classLevel };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.courseService.updateCourse(course.id!, {
          name: result.value.courseName,
          semester: result.value.semester,
          class_level: result.value.classLevel,
          department: department.id
        }).subscribe({
          next: () => {
            Swal.fire('Updated', 'Course updated successfully!', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error updating course:', error);
            Swal.fire('Error', 'Failed to update course', 'error');
          }
        });
      }
    });
  }

  deleteCourse(index: number) {
    if (this.selectedCollegeIndex === null || this.selectedDepartmentIndex === null) return;

    const course = this.colleges[this.selectedCollegeIndex].departments[this.selectedDepartmentIndex].courses[index];

    Swal.fire({
      title: 'Delete Course?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.courseService.deleteCourse(course.id!).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Course deleted successfully.', 'success');
            this.loadColleges();
          },
          error: (error) => {
            console.error('Error deleting course:', error);
            Swal.fire('Error', 'Failed to delete course', 'error');
          }
        });
      }
    });
  }
}
