import { Routes } from '@angular/router';
import { socioAuthGuard } from './guards/socio-auth.guard';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'noticias', loadComponent: () => import('./pages/noticias/noticias.component').then(m => m.NoticiasComponent) },
  { path: 'resultados', loadComponent: () => import('./pages/resultados/resultados.component').then(m => m.ResultadosComponent) },
  { path: 'fixture', loadComponent: () => import('./pages/fixture/fixture.component').then(m => m.FixtureComponent) },
  { path: 'admin/login', loadComponent: () => import('./pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  {
    path: 'admin/galeria',
    loadComponent: () => import('./pages/admin-galeria/admin-galeria.component').then(m => m.AdminGaleriaComponent),
    canActivate: [adminAuthGuard]
  },
  { path: 'galeria', loadComponent: () => import('./pages/galeria/galeria.component').then(m => m.GaleriaComponent) },
  { path: 'plantel', loadComponent: () => import('./pages/plantel/plantel.component').then(m => m.PlantelComponent) },
  { path: 'socios', loadComponent: () => import('./pages/socios/socios.component').then(m => m.SociosComponent) },
  { path: 'socios/login', loadComponent: () => import('./pages/socio-login/socio-login.component').then(m => m.SocioLoginComponent) },
  { path: 'mi-cuenta', loadComponent: () => import('./pages/mi-cuenta/mi-cuenta.component').then(m => m.MiCuentaComponent), canActivate: [socioAuthGuard] },
  { path: '**', redirectTo: 'inicio' }
];
