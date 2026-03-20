import { Injectable, signal } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { PartidoFixture } from '../data/fixture.data';
import {
  Partido,
  PARTIDOS_INICIALES,
  RESULTADOS_STORAGE_KEY
} from '../data/partido.model';
import { buscarPartidoCoincidente, partidoCoincideConFixture } from '../utils/fixture-partido-match';

interface PartidoResultadoRow {
  legacy_id: number;
  local: string;
  visitante: string;
  fecha: string;
  goles_local: number;
  goles_visitante: number;
  estado: Partido['estado'];
  minuto: number | null;
  live_started_at: number | null;
}

function rowToPartido(row: PartidoResultadoRow): Partido {
  return {
    id: row.legacy_id,
    local: row.local,
    visitante: row.visitante,
    fecha: row.fecha || undefined,
    golesLocal: row.goles_local,
    golesVisitante: row.goles_visitante,
    estado: row.estado,
    minuto: row.minuto ?? undefined,
    liveStartedAt: row.live_started_at ?? undefined
  };
}

function formatRemoteLoadError(err: PostgrestError): string {
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  ) {
    return 'No se encontró la tabla partido_resultados en Supabase. Ejecutá supabase-resultados.sql (o supabase-resultados-grants.sql) en el SQL Editor del proyecto.';
  }
  if (
    code === '42501' ||
    msg.includes('permission denied') ||
    msg.includes('row-level security')
  ) {
    return 'Sin permiso para leer resultados. Ejecutá de nuevo supabase-resultados.sql o el archivo supabase-resultados-grants.sql.';
  }
  return err.message || 'No se pudieron cargar los resultados desde la nube.';
}

function formatSyncError(err: PostgrestError): string {
  const msg = err.message || '';
  if (msg.includes('Unauthorized') || msg.includes('42501')) {
    return 'No se pudo guardar en la nube: contraseña de admin distinta del secreto en Supabase (tabla resultados_admin_secret) o sesión admin no válida.';
  }
  return msg || 'No se pudo sincronizar con Supabase.';
}

function partidoToRpcPayload(p: Partido) {
  return {
    legacy_id: p.id,
    local: p.local,
    visitante: p.visitante,
    fecha: p.fecha ?? '',
    goles_local: p.golesLocal,
    goles_visitante: p.golesVisitante,
    estado: p.estado,
    minuto: p.minuto ?? null,
    live_started_at: p.liveStartedAt ?? null
  };
}

@Injectable({ providedIn: 'root' })
export class ResultadosStorageService {
  /** Error al leer partido_resultados (tabla faltante, RLS, red). */
  readonly remoteLoadError = signal<string | null>(null);
  /** Último error al sincronizar (solo intenta si hay sesión admin). */
  readonly lastSyncError = signal<string | null>(null);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  /** Lee siempre desde localStorage (tras hydrate queda alineado con Supabase). */
  getPartidos(): Partido[] {
    try {
      const stored = localStorage.getItem(RESULTADOS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Partido[];
      }
    } catch {
      /* vacío */
    }
    return [...PARTIDOS_INICIALES];
  }

  private saveLocalOnly(partidos: Partido[]): void {
    try {
      localStorage.setItem(RESULTADOS_STORAGE_KEY, JSON.stringify(partidos));
    } catch {
      /* noop */
    }
  }

  ensureInitialSeed(): void {
    try {
      if (!localStorage.getItem(RESULTADOS_STORAGE_KEY)) {
        this.saveLocalOnly([...PARTIDOS_INICIALES]);
      }
    } catch {
      /* noop */
    }
  }

  /**
   * Carga resultados desde Supabase si hay datos; si no, mantiene localStorage / seed.
   * Llamar una vez al entrar a Fixture o Resultados.
   */
  async hydrateFromRemote(): Promise<void> {
    const client = this.supabase.client;
    if (!this.supabase.isConfigured || !client) {
      this.remoteLoadError.set(null);
      this.ensureInitialSeed();
      return;
    }

    const { data, error } = await client
      .from('partido_resultados')
      .select(
        'legacy_id, local, visitante, fecha, goles_local, goles_visitante, estado, minuto, live_started_at'
      )
      .order('legacy_id', { ascending: true });

    if (error) {
      this.remoteLoadError.set(formatRemoteLoadError(error));
      this.ensureInitialSeed();
      return;
    }

    this.remoteLoadError.set(null);

    if (data?.length) {
      const partidos = (data as PartidoResultadoRow[]).map(rowToPartido);
      this.saveLocalOnly(partidos);
      return;
    }

    // Tabla existe y está vacía: no borrar localStorage; solo seed si no hay nada guardado
    this.ensureInitialSeed();
  }

  async savePartidos(partidos: Partido[]): Promise<void> {
    this.saveLocalOnly(partidos);
    await this.pushToSupabaseIfAdmin(partidos);
  }

  private async pushToSupabaseIfAdmin(partidos: Partido[]): Promise<void> {
    const client = this.supabase.client;
    if (!this.supabase.isConfigured || !client || !this.auth.isAdmin()) {
      return;
    }

    const payload = partidos.map(partidoToRpcPayload);
    const { error } = await client.rpc('sync_partido_resultados', {
      p_admin_password: environment.adminPassword,
      p_partidos: payload
    });

    if (error) {
      const text = formatSyncError(error);
      this.lastSyncError.set(text);
      console.error('No se pudo sincronizar resultados con Supabase:', error.message, error);
      return;
    }

    this.lastSyncError.set(null);
  }

  findByFixture(f: PartidoFixture): Partido | undefined {
    return buscarPartidoCoincidente(this.getPartidos(), f);
  }

  nextId(partidos: Partido[]): number {
    const max = partidos.reduce((m, p) => Math.max(m, p.id), 0);
    return max + 1;
  }

  async upsertResultadoFinal(
    f: PartidoFixture,
    golesLocal: number,
    golesVisitante: number
  ): Promise<void> {
    const partidos = [...this.getPartidos()];
    const idx = partidos.findIndex((p) => partidoCoincideConFixture(p, f));
    const gl = Math.max(0, Math.min(99, Math.floor(Number(golesLocal)) || 0));
    const gv = Math.max(0, Math.min(99, Math.floor(Number(golesVisitante)) || 0));

    if (idx >= 0) {
      partidos[idx] = {
        ...partidos[idx],
        local: f.local,
        visitante: f.visitante,
        fecha: f.fecha,
        golesLocal: gl,
        golesVisitante: gv,
        estado: 'finalizado',
        minuto: undefined,
        liveStartedAt: undefined
      };
    } else {
      partidos.push({
        id: this.nextId(partidos),
        local: f.local,
        visitante: f.visitante,
        golesLocal: gl,
        golesVisitante: gv,
        estado: 'finalizado',
        fecha: f.fecha
      });
    }
    await this.savePartidos(partidos);
  }
}
