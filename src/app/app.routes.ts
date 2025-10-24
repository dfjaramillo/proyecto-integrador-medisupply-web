import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { UsuariosListComponent } from './usuarios/usuarios-list/usuarios-list';
import { InventarioListComponent } from './inventario/inventario-list/inventario-list';
import { ProveedoresListComponent } from './proveedores/proveedores-list/proveedores-list';
import { RoleRedirectComponent } from './core/components/role-redirect.component';
import { 
  authGuard, 
  administradorGuard, 
  comprasGuard, 
  ventasGuard, 
  logisticaGuard,
  inventarioAccessGuard 
} from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Protected routes with sidebar layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Administrador only - Gestión de usuarios
      { 
        path: 'usuarios', 
        component: UsuariosListComponent,
        canActivate: [administradorGuard]
      },
      // Compras y Logistica - Gestión de inventario (solo Compras puede crear productos)
      { 
        path: 'inventario', 
        component: InventarioListComponent,
        canActivate: [inventarioAccessGuard]
      },
      { 
        path: 'proveedores', 
        component: ProveedoresListComponent,
        canActivate: [comprasGuard]
      },
      // Ventas (Gerente de cuenta/vendedor) - Módulo de ventas (placeholder para futuro)
      // { 
      //   path: 'ventas', 
      //   component: VentasComponent,
      //   canActivate: [ventasGuard]
      // },
      // Logística (Personal logístico) - Módulo de logística (placeholder para futuro)
      // { 
      //   path: 'logistica', 
      //   component: LogisticaComponent,
      //   canActivate: [logisticaGuard]
      // },
      // Default redirect based on user role
      { 
        path: '', 
        pathMatch: 'full', 
        component: RoleRedirectComponent 
      }
    ]
  },

  // 404 simple
  { path: '**', redirectTo: 'login' }
];
