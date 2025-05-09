import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Import FormsModule
import Swal from 'sweetalert2';

import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';


@Component({
  selector: 'app-profile',
  standalone: true, // ✅ Ensure this is present if using standalone components
  imports: [CommonModule, FormsModule], // ✅ Include FormsModule here
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

 currentUserRole: '' | 'student' | 'hod' | 'bursar' | 'admin' | 'admin'='';

  user: any = null;

constructor(private router: Router,private authService: AuthService) {
  this.user = this.authService.getUser();
}

  isReadonly = true;
  disabled=true;

  enableEdit() {
    this.isReadonly = false;
    this.disabled=false;
  }

  save() {
    this.isReadonly = true;


    Swal.fire({
      icon: 'success',
      title: 'Profile Saved',
      text: 'Your profile has been successfully updated!',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK'

    });

  }

   onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
    }
  }



}

