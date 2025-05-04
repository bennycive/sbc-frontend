import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';


const routes: Routes = [


  {
    path: '',
    component:  AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent }
      // Add more admin routes here, like:
      // { path: 'requests', component: RequestsComponent }


    ]
  }

  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
