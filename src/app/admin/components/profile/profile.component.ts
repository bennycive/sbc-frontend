import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Import FormsModule
import Swal from 'sweetalert2';
@Component({
  selector: 'app-profile',
  standalone: true, // ✅ Ensure this is present if using standalone components
  imports: [CommonModule, FormsModule], // ✅ Include FormsModule here
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user = {
    firstName: 'Janet',
    lastName: 'Joel',
    middleName: 'Mussa',
    email: 'jane@example.com',
    phone: '+255123456789',
    nin: '1997120134607000334',
    birthday: '',
    gender: '',
    address: '',
    houseNumber: '',
    city: '',
    zip: '',
    image: ''
  };
  
  isReadonly = true;
  disabled=true;

  enableEdit() {
    this.isReadonly = false;
    this.disabled=false;
  }

  save() {
    this.isReadonly = true;
    console.log('User saved:', this.user);
  
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
      reader.onload = (e: any) => this.user.image = e.target.result;
      reader.readAsDataURL(file);
    }
  }


}

