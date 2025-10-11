import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { UsuariosListComponent } from './usuarios/usuarios-list/usuarios-list';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Protected routes with sidebar layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'usuarios', 
        component: UsuariosListComponent,
        canActivate: [adminGuard]
      },
      // Add more protected routes here
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' }
    ]
  },

  // 404 simple
  { path: '**', redirectTo: 'login' }
];
