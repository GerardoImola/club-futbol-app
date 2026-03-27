import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { socioSafeReturnUrl } from '../utils/socio-return-url';

export const socioAuthGuard: CanActivateFn = (_route, state) => {
  const clubAuth = inject(AuthService);
  if (clubAuth.isAdmin()) return true;

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isConfigured) {
    router.navigate(['/socios/login'], { queryParams: { error: 'config' } });
    return false;
  }

  const client = supabase.client;
  if (!client) return false;
  return client.auth.getSession().then(({ data: { session } }) => {
    if (session) return true;
    const returnUrl = socioSafeReturnUrl(state.url) ?? '/inicio';
    router.navigate(['/socios/login'], { queryParams: { returnUrl } });
    return false;
  });
};
