import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { UsuariosListComponent } from './usuarios/usuarios-list/usuarios-list';
import { InventarioListComponent } from './inventario/inventario-list/inventario-list';
import { authGuard, adminGuard, inventarioGuard } from './core/guards/auth.guard';

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
      { 
        path: 'inventario', 
        component: InventarioListComponent,
        canActivate: [inventarioGuard]
      },
      // Add more protected routes here
      { path: '', pathMatch: 'full', redirectTo: 'inventario' }
    ]
  },

  // 404 simple
  { path: '**', redirectTo: 'login' }
];
