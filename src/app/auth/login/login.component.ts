import { Component } from '@angular/core';
import { HeaderComponent } from "../../landing/components/header/header.component";
import { FooterComponent } from "../../landing/components/footer/footer.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {

}
