import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FotoGaleria } from '../../data/galeria.model';
import { AuthService } from '../../services/auth.service';
import { GaleriaStorageService } from '../../services/galeria-storage.service';

interface LightboxState {
  titulo: string;
  paths: string[];
  index: number;
}

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css'
})
export class GaleriaComponent implements OnInit {
  /** Álbumes definidos en el repo + los que vienen de Supabase (admin). */
  fotos = signal<FotoGaleria[]>([]);
  cargandoRemoto = false;
  avisoRemoto: string | null = null;

  private readonly fotosLocales: FotoGaleria[] = [
    
  ];

  lightbox: LightboxState | null = null;

  constructor(
    private galeriaStorage: GaleriaStorageService,
    public auth: AuthService
  ) {}

  async ngOnInit() {
    const base = [...this.fotosLocales];
    if (!this.galeriaStorage.isReady()) {
      this.fotos.set(base);
      return;
    }
    this.cargandoRemoto = true;
    this.avisoRemoto = null;
    try {
      const remoto = await this.galeriaStorage.loadAlbumsPublic();
      this.fotos.set([...base, ...remoto]);
    } catch (e) {
      this.avisoRemoto =
        e instanceof Error ? e.message : 'No se pudieron cargar álbumes desde el servidor.';
      this.fotos.set(base);
    } finally {
      this.cargandoRemoto = false;
    }
  }

  urlPublica(ruta: string): string {
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }
    return '/' + ruta.replace(/^\//, '');
  }

  abrirLightbox(foto: FotoGaleria): void {
    if (!foto.imagenes.length) return;
    this.lightbox = { titulo: foto.titulo, paths: [...foto.imagenes], index: 0 };
  }

  cerrarLightbox(): void {
    this.lightbox = null;
  }

  lightboxImagenActual(): string {
    if (!this.lightbox) return '';
    return this.urlPublica(this.lightbox.paths[this.lightbox.index]);
  }

  lightboxAnterior(): void {
    if (!this.lightbox || this.lightbox.paths.length < 2) return;
    const n = this.lightbox.paths.length;
    this.lightbox = {
      ...this.lightbox,
      index: (this.lightbox.index - 1 + n) % n
    };
  }

  lightboxSiguiente(): void {
    if (!this.lightbox || this.lightbox.paths.length < 2) return;
    const n = this.lightbox.paths.length;
    this.lightbox = {
      ...this.lightbox,
      index: (this.lightbox.index + 1) % n
    };
  }

  irLightbox(i: number): void {
    if (!this.lightbox || i < 0 || i >= this.lightbox.paths.length) return;
    this.lightbox = { ...this.lightbox, index: i };
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(e: KeyboardEvent): void {
    if (!this.lightbox) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrarLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.lightboxAnterior();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.lightboxSiguiente();
    }
  }
}
