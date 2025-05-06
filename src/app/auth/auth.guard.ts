import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    return true;
  }

  // Redirect to login
  window.location.href = '/auth/login';
  return false;

};





