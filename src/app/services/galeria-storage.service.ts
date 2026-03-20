import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { mensajeErrorSupabase } from '../utils/supabase-errors';
import type { FotoGaleria, GaleriaAlbumAdmin } from '../data/galeria.model';

@Injectable({ providedIn: 'root' })
export class GaleriaStorageService {
  constructor(private supabase: SupabaseService) {}

  private get client() {
    return this.supabase.client;
  }

  private adminPwd(): string {
    return (environment as { adminPassword?: string }).adminPassword ?? '';
  }

  isReady(): boolean {
    return this.supabase.isConfigured && !!this.client;
  }

  /** URL pública de un objeto ya subido al bucket `galeria`. */
  publicObjectUrl(storagePath: string): string {
    const base = (environment as { supabaseUrl?: string }).supabaseUrl?.replace(/\/$/, '') ?? '';
    return `${base}/storage/v1/object/public/galeria/${storagePath}`;
  }

  /** Álbumes con fotos para la galería pública (ordenados). */
  async loadAlbumsPublic(): Promise<FotoGaleria[]> {
    if (!this.client) return [];
    const { data: albums, error: e1 } = await this.client
      .from('galeria_albums')
      .select('id, titulo, sort_order, galeria_fotos ( storage_path, sort_order )')
      .order('sort_order', { ascending: true })
      .order('sort_order', { ascending: true, foreignTable: 'galeria_fotos' });
    if (e1) throw new Error(mensajeErrorSupabase(e1));
    const rows = (albums ?? []) as {
      id: string;
      titulo: string;
      sort_order: number;
      galeria_fotos: { storage_path: string; sort_order: number }[] | null;
    }[];
    const out: FotoGaleria[] = [];
    for (const a of rows) {
      const fotos = [...(a.galeria_fotos ?? [])].sort((x, y) => x.sort_order - y.sort_order);
      const imagenes = fotos.map((f) => this.publicObjectUrl(f.storage_path));
      if (imagenes.length === 0) continue;
      out.push({
        id: `db-${a.id}`,
        titulo: a.titulo,
        imagenes,
        origen: 'remoto'
      });
    }
    return out;
  }

  /** Todos los álbumes de Supabase (incluye vacíos) con id de cada foto — para admin. */
  async loadAlbumsAdmin(): Promise<GaleriaAlbumAdmin[]> {
    if (!this.client) return [];
    const { data: albums, error: e1 } = await this.client
      .from('galeria_albums')
      .select('id, titulo, sort_order, galeria_fotos ( id, storage_path, sort_order )')
      .order('sort_order', { ascending: true })
      .order('sort_order', { ascending: true, foreignTable: 'galeria_fotos' });
    if (e1) throw new Error(mensajeErrorSupabase(e1));
    const rows = (albums ?? []) as {
      id: string;
      titulo: string;
      galeria_fotos: { id: string; storage_path: string; sort_order: number }[] | null;
    }[];
    return rows.map((a) => {
      const fotos = [...(a.galeria_fotos ?? [])].sort((x, y) => x.sort_order - y.sort_order);
      return {
        id: a.id,
        titulo: a.titulo,
        fotos: fotos.map((f) => ({
          id: f.id,
          storagePath: f.storage_path,
          url: this.publicObjectUrl(f.storage_path)
        }))
      };
    });
  }

  async crearAlbum(titulo: string): Promise<string> {
    const c = this.client;
    if (!c) throw new Error('Supabase no está configurado.');
    const { data, error } = await c.rpc('rpc_galeria_crear_album', {
      p_password: this.adminPwd(),
      p_titulo: titulo
    });
    if (error) throw new Error(mensajeErrorSupabase(error));
    return data as string;
  }

  async renombrarAlbum(albumId: string, titulo: string): Promise<void> {
    const c = this.client;
    if (!c) throw new Error('Supabase no está configurado.');
    const { error } = await c.rpc('rpc_galeria_renombrar_album', {
      p_password: this.adminPwd(),
      p_album_id: albumId,
      p_titulo: titulo
    });
    if (error) throw new Error(mensajeErrorSupabase(error));
  }

  async eliminarFoto(fotoId: string): Promise<void> {
    const c = this.client;
    if (!c) throw new Error('Supabase no está configurado.');
    const { data: path, error } = await c.rpc('rpc_galeria_eliminar_foto', {
      p_password: this.adminPwd(),
      p_foto_id: fotoId
    });
    if (error) throw new Error(mensajeErrorSupabase(error));
    const storagePath = path as string | null;
    if (storagePath) {
      const { error: delErr } = await c.storage.from('galeria').remove([storagePath]);
      if (delErr) throw new Error(mensajeErrorSupabase(delErr));
    }
  }

  async eliminarAlbum(albumId: string): Promise<void> {
    const c = this.client;
    if (!c) throw new Error('Supabase no está configurado.');
    const { data: paths, error } = await c.rpc('rpc_galeria_eliminar_album', {
      p_password: this.adminPwd(),
      p_album_id: albumId
    });
    if (error) throw new Error(mensajeErrorSupabase(error));
    const list = (paths ?? []) as string[];
    if (list.length > 0) {
      const { error: delErr } = await c.storage.from('galeria').remove(list);
      if (delErr) throw new Error(mensajeErrorSupabase(delErr));
    }
  }

  async subirFotos(albumId: string, files: File[]): Promise<void> {
    const c = this.client;
    if (!c) throw new Error('Supabase no está configurado.');
    const pwd = this.adminPwd();
    for (const file of files) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const path = `${albumId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await c.storage.from('galeria').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg'
      });
      if (upErr) throw new Error(mensajeErrorSupabase(upErr));
      const { error: rpcErr } = await c.rpc('rpc_galeria_registrar_foto', {
        p_password: pwd,
        p_album_id: albumId,
        p_storage_path: path
      });
      if (rpcErr) throw new Error(mensajeErrorSupabase(rpcErr));
    }
  }
}
