import { Routes } from '@angular/router';
import { LoginComponent } from './auth//login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { UsuariosListComponent } from './usuarios/usuarios-list/usuarios-list';
import { ClientesPendientesComponent } from './usuarios/clientes-pendientes/clientes-pendientes';
import { InventarioListComponent } from './inventario/inventario-list/inventario-list';
import { ProveedoresListComponent } from './proveedores/proveedores-list/proveedores-list';
import { SalesPlanListComponent } from './ventas/sales-plan-list/sales-plan-list';
import { RoutesListComponent } from './logistica/routes-list/routes-list';
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
      {
        path: 'clientes',
        component: ClientesPendientesComponent,
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
      // Ventas (Gerente de cuenta/vendedor) - Planes de ventas
      { 
        path: 'planes-ventas', 
        component: SalesPlanListComponent,
        canActivate: [ventasGuard]
      },
      // Ventas - Reporte operativo
      {
        path: 'ventas/reporte-operativo',
        loadComponent: () => import('./ventas/reports/operational-report/operational-report').then(m => m.OperationalReportComponent),
        canActivate: [ventasGuard]
      },
      // Logística (Personal logístico) - Gestión de rutas de entrega
      { 
        path: 'logistica/rutas', 
        component: RoutesListComponent,
        canActivate: [logisticaGuard]
      },
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
