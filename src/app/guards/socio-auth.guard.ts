import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const socioAuthGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isConfigured) {
    router.navigate(['/socios'], { queryParams: { error: 'config' } });
    return false;
  }

  const client = supabase.client;
  if (!client) return false;
  return client.auth.getSession().then(({ data: { session } }) => {
    if (session) return true;
    router.navigate(['/socios/login'], { queryParams: { returnUrl: '/mi-cuenta' } });
    return false;
  });
};
