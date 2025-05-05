import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FooterComponent } from "../components/footer/footer.component";
import { HeaderComponent } from "../components/header/header.component";

@Component({
  selector: 'app-landing',
  imports: [CommonModule, FooterComponent, HeaderComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {



  services = [
    {
      title: 'Certificate Request',
      description: 'Request for your graduation or completion certificate.',
      icon: 'bi bi-file-earmark-text'
    },
    {
      title: 'Online Clearance',
      description: 'Submit clearance forms digitally for approvals.',
      icon: 'bi bi-check-circle'
    },
    {
      title: 'Transcript Request',
      description: 'Get your academic transcripts processed online.',
      icon: 'bi bi-journal-text'
    },
    {
      title: 'Professional Result Request',
      description: 'Request verified professional exam results.',
      icon: 'bi bi-award'
    },
    {
      title: 'Track Requests',
      description: 'Monitor the status of all your submitted requests.',
      icon: 'bi bi-search'
    },
    {
      title: 'Bimetric Verification',
      description: 'Biometric verifications requests.',
      icon: 'bi bi-fingerprint'
    }





  ];


}
