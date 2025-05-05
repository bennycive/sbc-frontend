import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {


  user = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+255123456789',
    role: 'Admin'
  };

  editProfile() {
    
    alert('Edit Profile Clicked');

  }


}
