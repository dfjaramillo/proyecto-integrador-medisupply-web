import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { UsuariosListComponent } from './usuarios/usuarios-list/usuarios-list';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Protected routes with sidebar layout
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'usuarios', component: UsuariosListComponent },
      // Add more protected routes here
      { path: '', pathMatch: 'full', redirectTo: 'login' }
    ]
  },

  // 404 simple
  { path: '**', redirectTo: 'login' }
];
