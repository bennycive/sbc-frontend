import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CertificateRequestsComponent } from './components/certificate-requests/certificate-requests.component';
import { CertificateAndIdsListComponent } from './components/certificate-and-ids-list/certificate-and-ids-list.component';
import { UsersComponent } from './components/users/users.component';
import { BiometricSetupComponent } from './components/biometric-setup/biometric-setup.component';
import { FinancialVerificationsComponent } from './components/financial-verifications/financial-verifications.component';
import { VerifyRecordsComponent } from './components/verify-records/verify-records.component';
import { CollageComponent } from './components/collage/collage.component';
import { FinancialRecordsComponent } from './components/financial-records/financial-records.component';
import { ViewCertificatesComponent } from './components/view-certificates/view-certificates.component';


const routes: Routes = [


  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'certificates-requests', component : CertificateRequestsComponent },
      { path: 'certificates-and-ids-list', component: CertificateAndIdsListComponent},
      { path: 'users', component: UsersComponent },
      { path: 'biometric-setups', component: BiometricSetupComponent},
      { path: 'financial-records', component: FinancialRecordsComponent},
      { path: 'financial-verifications', component: FinancialVerificationsComponent},
      { path: 'verify-records', component: VerifyRecordsComponent},
      {
        path: 'collage', component:  CollageComponent
      },
      {path: 'view-certificates', component: ViewCertificatesComponent },


    ]

  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }
