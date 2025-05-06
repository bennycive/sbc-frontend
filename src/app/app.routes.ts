import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ProfileComponent } from './admin/components/profile/profile.component';

export const routes: Routes = [

  { path: '', loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'dashbord',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard], 
     
     

  },

  { path: '**', redirectTo: '' }

];







