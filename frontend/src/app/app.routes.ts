// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'verify',
    pathMatch: 'full',
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./components/verify-credential/verify-credential.component')
        .then(m => m.VerifyCredentialComponent),
  },
  {
    path: 'issue',
    loadComponent: () =>
      import('./components/issuer-portal/issuer-portal.component')
        .then(m => m.IssuerPortalComponent),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./components/student-portal/student-portal.component')
        .then(m => m.StudentPortalComponent),
  },
];