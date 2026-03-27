import { Injectable, signal } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { Noticia, NOTICIAS_SEED } from '../data/noticia.model';

const STORAGE_KEY = 'cac_noticias_v1';

function formatLoadError(err: PostgrestError): string {
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('does not exist') || err.code === 'PGRST205') {
    return 'Falta la tabla noticias o la función sync_noticias_admin. Ejecutá supabase-noticias.sql.';
  }
  if (err.code === '42501' || msg.includes('permission')) {
    return 'Sin permiso para leer noticias.';
  }
  return err.message || 'No se pudieron cargar las noticias.';
}

@Injectable({ providedIn: 'root' })
export class NoticiasStorageService {
  lista = signal<Noticia[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  cargando = signal(false);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async load(): Promise<void> {
    this.cargando.set(true);
    this.loadError.set(null);
    try {
      const client = this.supabase.client;
      if (this.supabase.isConfigured && client) {
        const { data, error } = await client
          .from('noticias')
          .select('legacy_id, titulo, resumen, fecha, intro, logros, cierre, orden')
          .order('orden', { ascending: true });

        if (!error && data?.length) {
          const list = data.map((row) => this.rowToNoticia(row));
          this.lista.set(list);
          this.saveLocal(list);
          return;
        }
        if (error) {
          this.loadError.set(formatLoadError(error));
        }
      }

      const local = this.readLocal();
      if (local.length) {
        this.lista.set(local);
        return;
      }

      this.lista.set([...NOTICIAS_SEED]);
    } finally {
      this.cargando.set(false);
    }
  }

  private rowToNoticia(row: {
    legacy_id: number;
    titulo: string;
    resumen: string;
    fecha: string;
    intro: string | null;
    logros: unknown;
    cierre: string | null;
  }): Noticia {
    const logros = row.logros;
    const arr =
      Array.isArray(logros) ? logros.map((x) => String(x)) : undefined;
    return {
      id: row.legacy_id,
      titulo: row.titulo,
      resumen: row.resumen,
      fecha: row.fecha,
      intro: row.intro ?? undefined,
      logros: arr?.length ? arr : undefined,
      cierre: row.cierre ?? undefined
    };
  }

  private readLocal(): Noticia[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Noticia[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveLocal(list: Noticia[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* noop */
    }
  }

  nextId(list: Noticia[]): number {
    const max = list.reduce((m, n) => Math.max(m, n.id), 0);
    return max + 1;
  }

  /** Nueva noticia arriba del listado (orden 0 en sync). */
  agregar(noticia: Noticia): void {
    this.lista.update((arr) => [noticia, ...arr]);
    this.saveLocal(this.lista());
  }

  async guardarEnNube(): Promise<boolean> {
    this.saveError.set(null);
    const list = this.lista();
    this.saveLocal(list);

    const client = this.supabase.client;
    if (!this.supabase.isConfigured || !client || !this.auth.isAdmin()) {
      return true;
    }

    const payload = list.map((n) => ({
      legacy_id: n.id,
      titulo: n.titulo,
      resumen: n.resumen,
      fecha: n.fecha,
      intro: n.intro ?? null,
      logros: n.logros ?? null,
      cierre: n.cierre ?? null
    }));

    const { error } = await client.rpc('sync_noticias_admin', {
      p_admin_password: environment.adminPassword,
      p_noticias: payload
    });

    if (error) {
      const msg =
        error.message?.includes('Unauthorized') || error.code === '42501'
          ? 'Contraseña de admin distinta del secreto en Supabase o no sos administrador.'
          : error.message || 'No se pudo guardar en la nube.';
      this.saveError.set(msg);
      return false;
    }

    return true;
  }
}
