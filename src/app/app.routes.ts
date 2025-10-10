import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // redirección por defecto
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // 404 simple
  { path: '**', redirectTo: 'login' }
];
