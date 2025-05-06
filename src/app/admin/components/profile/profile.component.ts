import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // ✅ Import FormsModule

@Component({
  selector: 'app-profile',
  standalone: true, // ✅ Ensure this is present if using standalone components
  imports: [CommonModule, FormsModule], // ✅ Include FormsModule here
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+255123456789',
    birthday: '',
    gender: '',
    address: '',
    houseNumber: '',
    city: '',
    zip: '',
    image: ''
  };
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.user.image = e.target.result;
      reader.readAsDataURL(file);
    }
  }
  

  updateProfile() {
    alert('Profile updated!');
  }
}
