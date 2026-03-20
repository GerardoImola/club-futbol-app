import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private _client: SupabaseClient | null = null;

  get client(): SupabaseClient | null {
    return this._client;
  }

  get isConfigured(): boolean {
    const env = environment as { supabaseUrl?: string; supabaseKey?: string };
    return !!(env.supabaseUrl && env.supabaseKey);
  }

  constructor() {
    const env = environment as { supabaseUrl?: string; supabaseKey?: string };
    const url = env.supabaseUrl?.trim();
    const key = env.supabaseKey?.trim();
    if (url && key) {
      // Sin forzar PKCE: en http://IP-local:4200 (celular en la red) no hay "secure context" y puede fallar.
      this._client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
  }
}
