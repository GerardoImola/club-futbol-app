import { Routes } from '@angular/router';
import { socioAuthGuard } from './guards/socio-auth.guard';
import { adminAuthGuard } from './guards/admin-auth.guard';

const socioProtected = {
  canActivate: [socioAuthGuard]
};

export const routes: Routes = [
  { path: '', redirectTo: 'socios/login', pathMatch: 'full' },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    ...socioProtected
  },
  {
    path: 'noticias',
    loadComponent: () => import('./pages/noticias/noticias.component').then(m => m.NoticiasComponent),
    ...socioProtected
  },
  {
    path: 'resultados',
    loadComponent: () => import('./pages/resultados/resultados.component').then(m => m.ResultadosComponent),
    ...socioProtected
  },
  {
    path: 'fixture',
    loadComponent: () => import('./pages/fixture/fixture.component').then(m => m.FixtureComponent),
    ...socioProtected
  },
  { path: 'admin/login', redirectTo: 'socios/login', pathMatch: 'full' },
  {
    path: 'admin/galeria',
    loadComponent: () => import('./pages/admin-galeria/admin-galeria.component').then(m => m.AdminGaleriaComponent),
    canActivate: [adminAuthGuard]
  },
  {
    path: 'admin/socios',
    loadComponent: () => import('./pages/admin-socios/admin-socios.component').then(m => m.AdminSociosComponent),
    canActivate: [socioAuthGuard, adminAuthGuard]
  },
  {
    path: 'galeria',
    loadComponent: () => import('./pages/galeria/galeria.component').then(m => m.GaleriaComponent),
    ...socioProtected
  },
  {
    path: 'plantel',
    loadComponent: () => import('./pages/plantel/plantel.component').then(m => m.PlantelComponent),
    ...socioProtected
  },
  {
    path: 'socios',
    loadComponent: () => import('./pages/socios/socios.component').then(m => m.SociosComponent),
    ...socioProtected
  },
  { path: 'socios/login', loadComponent: () => import('./pages/socio-login/socio-login.component').then(m => m.SocioLoginComponent) },
  {
    path: 'mi-cuenta',
    loadComponent: () => import('./pages/mi-cuenta/mi-cuenta.component').then(m => m.MiCuentaComponent),
    ...socioProtected
  },
  { path: '**', redirectTo: 'inicio' }
];
