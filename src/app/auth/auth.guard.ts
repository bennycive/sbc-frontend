import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');

    if (token) {
      return true;
    }

    // Redirect to login in the browser
    window.location.href = '/auth/login';
  }

  // On the server or if no token found
  return false;
};
