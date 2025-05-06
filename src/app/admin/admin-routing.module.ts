import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CertificateRequestsComponent } from './components/certificate-requests/certificate-requests.component';
import { CertificateAndIdsListComponent } from './components/certificate-and-ids-list/certificate-and-ids-list.component';


const routes: Routes = [


  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'certificates-requests', component : CertificateRequestsComponent },
      { path: 'certificates-and-ids-list', component: CertificateAndIdsListComponent}

    ]

  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
