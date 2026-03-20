import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GaleriaStorageService } from '../../services/galeria-storage.service';
import { extractErrorText } from '../../utils/supabase-errors';
import type { GaleriaAlbumAdmin } from '../../data/galeria.model';

@Component({
  selector: 'app-admin-galeria',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-galeria.component.html',
  styleUrl: './admin-galeria.component.css'
})
export class AdminGaleriaComponent implements OnInit {
  titulo = '';
  enviando = false;
  busy = false;
  cargandoLista = false;
  error: string | null = null;
  ok: string | null = null;
  archivos: File[] = [];

  albumes: GaleriaAlbumAdmin[] = [];
  /** Borrador de título por id de álbum (sync al cargar lista). */
  titulosDraft: Record<string, string> = {};

  /** Modal: eliminar una foto (null = cerrado). */
  confirmarEliminarFoto: { id: string; previewUrl: string } | null = null;

  /** Modal: eliminar carpeta completa (null = cerrado). */
  confirmarEliminarAlbum: {
    id: string;
    titulo: string;
    cantidadFotos: number;
    primeraPreviewUrl: string | null;
  } | null = null;

  /** Pantalla principal: editar carpetas existentes o crear una nueva. */
  vistaAdmin: 'editar' | 'nuevo' = 'nuevo';

  constructor(public galeria: GaleriaStorageService) {}

  elegirVista(v: 'editar' | 'nuevo'): void {
    this.vistaAdmin = v;
    this.error = null;
    this.ok = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmarEliminarFoto) this.cerrarModalEliminarFoto();
    else if (this.confirmarEliminarAlbum) this.cerrarModalEliminarAlbum();
  }

  async ngOnInit() {
    await this.refrescarAlbumes();
  }

  private syncDrafts() {
    const d: Record<string, string> = {};
    for (const a of this.albumes) d[a.id] = a.titulo;
    this.titulosDraft = d;
  }

  async refrescarAlbumes() {
    if (!this.galeria.isReady()) return;
    this.cargandoLista = true;
    this.error = null;
    try {
      this.albumes = await this.galeria.loadAlbumsAdmin();
      this.syncDrafts();
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'No se pudo cargar la lista de álbumes.';
    } finally {
      this.cargandoLista = false;
    }
  }

  onFilesChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivos = input.files ? Array.from(input.files) : [];
    this.error = null;
    this.ok = null;
  }

  async guardarNuevaTarjeta() {
    this.error = null;
    this.ok = null;
    const t = this.titulo.trim();
    if (!t) {
      this.error = 'Escribí un nombre para la tarjeta.';
      return;
    }
    if (!this.archivos.length) {
      this.error = 'Elegí al menos una foto (podés usar la cámara del celular).';
      return;
    }
    if (!this.galeria.isReady()) {
      this.error = 'Supabase no está configurado. Revisá environment y ejecutá supabase-galeria.sql.';
      return;
    }
    this.enviando = true;
    this.busy = true;
    try {
      const albumId = await this.galeria.crearAlbum(t);
      await this.galeria.subirFotos(albumId, this.archivos);
      this.ok = `Listo: se creó “${t}” con ${this.archivos.length} foto(s).`;
      this.titulo = '';
      this.archivos = [];
      const input = document.getElementById('admin-galeria-files') as HTMLInputElement | null;
      if (input) input.value = '';
      await this.refrescarAlbumes();
      this.elegirVista('editar');
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'Algo salió mal al guardar.';
    } finally {
      this.enviando = false;
      this.busy = false;
    }
  }

  async guardarNombreAlbum(albumId: string) {
    const t = (this.titulosDraft[albumId] ?? '').trim();
    if (!t) {
      this.error = 'El nombre no puede estar vacío.';
      return;
    }
    this.error = null;
    this.ok = null;
    this.busy = true;
    try {
      await this.galeria.renombrarAlbum(albumId, t);
      this.ok = 'Nombre actualizado.';
      await this.refrescarAlbumes();
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'No se pudo guardar el nombre.';
    } finally {
      this.busy = false;
    }
  }

  async onAgregarFotosAlbum(albumId: string, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) return;
    this.error = null;
    this.ok = null;
    this.busy = true;
    try {
      await this.galeria.subirFotos(albumId, files);
      this.ok = `Se agregaron ${files.length} foto(s).`;
      await this.refrescarAlbumes();
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'Error al subir fotos.';
    } finally {
      this.busy = false;
    }
  }

  pedirEliminarFoto(foto: { id: string; url: string }): void {
    this.error = null;
    this.confirmarEliminarAlbum = null;
    this.confirmarEliminarFoto = { id: foto.id, previewUrl: foto.url };
  }

  cerrarModalEliminarFoto(): void {
    this.confirmarEliminarFoto = null;
  }

  pedirEliminarAlbum(a: GaleriaAlbumAdmin): void {
    this.error = null;
    this.confirmarEliminarFoto = null;
    const primera = a.fotos[0]?.url ?? null;
    this.confirmarEliminarAlbum = {
      id: a.id,
      titulo: a.titulo,
      cantidadFotos: a.fotos.length,
      primeraPreviewUrl: primera
    };
  }

  cerrarModalEliminarAlbum(): void {
    this.confirmarEliminarAlbum = null;
  }

  async confirmarEliminarAlbumSi(): Promise<void> {
    const target = this.confirmarEliminarAlbum;
    if (!target) return;
    this.cerrarModalEliminarAlbum();
    this.error = null;
    this.ok = null;
    this.busy = true;
    try {
      await this.galeria.eliminarAlbum(target.id);
      this.ok = 'Carpeta eliminada.';
      await this.refrescarAlbumes();
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'No se pudo eliminar la carpeta.';
    } finally {
      this.busy = false;
    }
  }

  async confirmarEliminarFotoSi(): Promise<void> {
    const target = this.confirmarEliminarFoto;
    if (!target) return;
    this.cerrarModalEliminarFoto();
    this.error = null;
    this.ok = null;
    this.busy = true;
    try {
      await this.galeria.eliminarFoto(target.id);
      this.ok = 'Foto eliminada.';
      await this.refrescarAlbumes();
    } catch (e) {
      this.error =
        e instanceof Error && e.message
          ? e.message
          : extractErrorText(e) || 'No se pudo eliminar la foto.';
    } finally {
      this.busy = false;
    }
  }

}
