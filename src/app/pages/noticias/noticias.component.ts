import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Noticia } from '../../data/noticia.model';
import { AuthService } from '../../services/auth.service';
import { NoticiasStorageService } from '../../services/noticias-storage.service';

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css'
})
export class NoticiasComponent implements OnInit {
  expandido: Record<number, boolean> = {};

  nuevaTitulo = '';
  nuevaResumen = '';
  nuevaFecha = '';
  nuevaIntro = '';
  nuevaCierre = '';
  nuevaLogrosRaw = '';
  formError = '';
  guardandoNube = false;
  mensajeAdmin = '';
  /** Panel nueva noticia (FAB +) */
  mostrarFormNuevaNoticia = false;

  constructor(
    public readonly noticiasStore: NoticiasStorageService,
    public readonly auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.noticiasStore.load();
  }

  abrirNuevaNoticia(): void {
    this.mostrarFormNuevaNoticia = true;
    this.formError = '';
  }

  cerrarNuevaNoticia(): void {
    this.mostrarFormNuevaNoticia = false;
  }

  toggleNoticia(id: number): void {
    this.expandido[id] = !this.expandido[id];
  }

  estaExpandida(id: number): boolean {
    return !!this.expandido[id];
  }

  /** Agrega la noticia al listado y sincroniza con Supabase (un solo paso). */
  async publicarNoticia(): Promise<void> {
    this.formError = '';
    this.mensajeAdmin = '';
    const titulo = this.nuevaTitulo.trim();
    const resumen = this.nuevaResumen.trim();
    const fecha = this.nuevaFecha.trim();
    if (!titulo || !resumen || !fecha) {
      this.formError = 'Completá título, resumen y fecha.';
      return;
    }
    const logros = this.nuevaLogrosRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const noticia: Noticia = {
      id: this.noticiasStore.nextId(this.noticiasStore.lista()),
      titulo,
      resumen,
      fecha,
      intro: this.nuevaIntro.trim() || undefined,
      cierre: this.nuevaCierre.trim() || undefined,
      logros: logros.length ? logros : undefined
    };
    this.noticiasStore.agregar(noticia);
    this.nuevaTitulo = '';
    this.nuevaResumen = '';
    this.nuevaFecha = '';
    this.nuevaIntro = '';
    this.nuevaCierre = '';
    this.nuevaLogrosRaw = '';

    this.guardandoNube = true;
    try {
      const ok = await this.noticiasStore.guardarEnNube();
      if (ok) {
        await this.noticiasStore.load();
        this.mensajeAdmin = 'Noticia publicada.';
      }
    } finally {
      this.guardandoNube = false;
    }
  }
}
