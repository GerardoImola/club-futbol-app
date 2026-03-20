import { Injectable, signal } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { FIXTURE, PartidoFixture } from '../data/fixture.data';

export interface FixtureLoadResult {
  partidos: PartidoFixture[];
  /** null = todo OK desde BD o fallback sin aviso crítico */
  aviso: string | null;
}

function formatFixtureLoadError(err: PostgrestError): string {
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  ) {
    return 'No se encontró la tabla fixture_partidos en Supabase. Ejecutá supabase-fixture.sql (y supabase-fixture-rpc.sql si querés publicar desde la app).';
  }
  if (
    code === '42501' ||
    msg.includes('permission denied') ||
    msg.includes('row-level security')
  ) {
    return 'Sin permiso para leer el fixture. Revisá políticas RLS y GRANT en supabase-fixture.sql.';
  }
  return err.message || 'No se pudo cargar el fixture desde la nube.';
}

function formatFixtureSyncError(err: PostgrestError): string {
  const msg = err.message || '';
  if (msg.includes('Unauthorized') || msg.includes('42501')) {
    return 'No se pudo guardar el fixture: contraseña de admin distinta del secreto en Supabase o falta ejecutar supabase-resultados.sql (tabla resultados_admin_secret).';
  }
  return msg || 'No se pudo sincronizar el fixture con Supabase.';
}

@Injectable({ providedIn: 'root' })
export class FixtureService {
  readonly fixtureLoadError = signal<string | null>(null);
  readonly fixtureSyncError = signal<string | null>(null);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async loadFixture(): Promise<FixtureLoadResult> {
    const fallback = (): FixtureLoadResult => ({
      partidos: [...FIXTURE],
      aviso: null
    });

    if (!this.supabase.isConfigured || !this.supabase.client) {
      this.fixtureLoadError.set(null);
      return fallback();
    }

    const { data, error } = await this.supabase.client
      .from('fixture_partidos')
      .select('local, visitante, fecha')
      .order('orden', { ascending: true });

    if (error) {
      this.fixtureLoadError.set(formatFixtureLoadError(error));
      return {
        partidos: [...FIXTURE],
        aviso: null
      };
    }

    this.fixtureLoadError.set(null);

    if (!data?.length) {
      return {
        partidos: [...FIXTURE],
        aviso:
          'El fixture en la base está vacío. Ejecutá supabase-fixture.sql o publicá el calendario como admin desde Fixture.'
      };
    }

    return {
      partidos: data.map((row) => ({
        local: row.local as string,
        visitante: row.visitante as string,
        fecha: row.fecha as string
      })),
      aviso: null
    };
  }

  /**
   * Reemplaza fixture_partidos en Supabase (orden = posición en el array).
   * Solo con sesión admin; usa la misma clave que resultados_admin_secret.
   */
  async syncFixtureToRemote(partidos: PartidoFixture[]): Promise<boolean> {
    const client = this.supabase.client;
    if (!this.supabase.isConfigured || !client || !this.auth.isAdmin()) {
      return false;
    }

    this.fixtureSyncError.set(null);

    const payload = partidos.map((p, i) => ({
      orden: i + 1,
      fecha: p.fecha,
      local: p.local,
      visitante: p.visitante
    }));

    const { error } = await client.rpc('sync_fixture_partidos', {
      p_admin_password: environment.adminPassword,
      p_rows: payload
    });

    if (error) {
      this.fixtureSyncError.set(formatFixtureSyncError(error));
      console.error('sync_fixture_partidos:', error.message, error);
      return false;
    }

    return true;
  }
}
