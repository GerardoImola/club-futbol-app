import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FixtureService } from '../../services/fixture.service';
import { ResultadosStorageService } from '../../services/resultados-storage.service';
import { PartidoFixture } from '../../data/fixture.data';
import { Partido, PARTIDOS_INICIALES } from '../../data/partido.model';
import { buscarPartidoCoincidente } from '../../utils/fixture-partido-match';

/** Fila en pantalla: partido del fixture (BD) + resultado en localStorage si existe */
export interface PartidoResultadoVista {
  fixture: PartidoFixture;
  partido?: Partido;
}

export type { Partido };

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit, OnDestroy {
  partidos: Partido[] = [];
  /** Fixture desde Supabase filtrado solo a partidos de Canalense */
  fixtureCanalense: PartidoFixture[] = [];
  /** Lo que se muestra: cada fila del fixture CAC + merge con resultado guardado */
  partidosVista: PartidoResultadoVista[] = [];
  cargandoFixture = false;
  avisoFixture: string | null = null;
  showForm = false;
  editingPartido: Partido | null = null;
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    private fixtureService: FixtureService,
    public readonly resultadosStorage: ResultadosStorageService
  ) {}

  form = {
    local: '',
    visitante: '',
    golesLocal: 0,
    golesVisitante: 0,
    estado: 'por-jugar' as Partido['estado'],
    minuto: 0,
    fecha: ''
  };

  async ngOnInit() {
    await this.resultadosStorage.hydrateFromRemote();
    await this.cargarFixtureCanalense();
    this.cargarPartidos();
    this.rebuildVista();
    this.iniciarReloj();
  }

  private async cargarFixtureCanalense() {
    this.cargandoFixture = true;
    const res = await this.fixtureService.loadFixture();
    this.avisoFixture = res.aviso;
    this.fixtureCanalense = res.partidos.filter(
      (p) => p.local.includes('Canalense') || p.visitante.includes('Canalense')
    );
    this.cargandoFixture = false;
  }

  private rebuildVista() {
    if (this.fixtureCanalense.length > 0) {
      this.partidosVista = this.fixtureCanalense.map((f) => ({
        fixture: f,
        partido: buscarPartidoCoincidente(this.partidos, f)
      }));
    } else {
      this.partidosVista = this.partidos
        .filter(
          (p) =>
            p.local.includes('Canalense') || p.visitante.includes('Canalense')
        )
        .map((p) => ({
          fixture: {
            local: p.local,
            visitante: p.visitante,
            fecha: p.fecha || '—'
          },
          partido: p
        }));
    }
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private iniciarReloj() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      const hayEnVivo = this.partidos.some((p) => p.estado === 'en-vivo');
      if (hayEnVivo) {
        this.partidos = [...this.partidos];
        this.rebuildVista();
      }
    }, 10000);
  }

  minutoActual(p: Partido): number {
    if (p.estado !== 'en-vivo' || p.liveStartedAt == null) return p.minuto ?? 0;
    const base = p.minuto ?? 0;
    const elapsed = Math.floor((Date.now() - p.liveStartedAt) / 60000);
    return Math.min(base + elapsed, 120);
  }

  private cargarPartidos() {
    this.partidos = this.resultadosStorage.getPartidos();
  }

  private async guardarPartidos() {
    await this.resultadosStorage.savePartidos(this.partidos);
  }

  private nextId(): number {
    return this.resultadosStorage.nextId(this.partidos);
  }

  abrirAgregar() {
    this.editingPartido = null;
    this.form = {
      local: 'Club Atlético Canalense',
      visitante: '',
      golesLocal: 0,
      golesVisitante: 0,
      estado: 'por-jugar',
      minuto: 0,
      fecha: ''
    };
    this.showForm = true;
  }

  abrirEditar(p: Partido) {
    this.editingPartido = p;
    const minuto = p.estado === 'en-vivo' && p.liveStartedAt != null
      ? this.minutoActual(p)
      : (p.minuto ?? 0);
    this.form = {
      local: p.local,
      visitante: p.visitante,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      estado: p.estado,
      minuto,
      fecha: p.fecha ?? ''
    };
    this.showForm = true;
  }

  cerrarForm() {
    this.showForm = false;
    this.editingPartido = null;
  }

  async guardar() {
    if (!this.form.local.trim() || !this.form.visitante.trim()) return;

    /** Misma cadena que en el fixture (ej. Dom 22/03); si falta, no coincide con la tarjeta del calendario */
    const fechaVal = this.form.fecha?.trim() || undefined;

    if (this.editingPartido) {
      const p = this.partidos.find(x => x.id === this.editingPartido!.id);
      if (p) {
        const yaEstabaEnVivo = p.estado === 'en-vivo' && p.liveStartedAt != null;
        p.local = this.form.local.trim();
        p.visitante = this.form.visitante.trim();
        p.golesLocal = this.form.golesLocal;
        p.golesVisitante = this.form.golesVisitante;
        p.estado = this.form.estado;
        if (this.form.estado === 'en-vivo') {
          p.minuto = this.form.minuto;
          if (!yaEstabaEnVivo) p.liveStartedAt = Date.now();
        } else {
          p.minuto = undefined;
          p.liveStartedAt = undefined;
        }
        p.fecha = fechaVal ?? p.fecha;
      }
    } else {
      const liveStartedAt = this.form.estado === 'en-vivo' ? Date.now() : undefined;
      this.partidos.push({
        id: this.nextId(),
        local: this.form.local.trim(),
        visitante: this.form.visitante.trim(),
        golesLocal: this.form.golesLocal,
        golesVisitante: this.form.golesVisitante,
        estado: this.form.estado,
        minuto: this.form.estado === 'en-vivo' ? this.form.minuto : undefined,
        liveStartedAt,
        fecha: fechaVal
      });
    }

    await this.guardarPartidos();
    this.rebuildVista();
    this.cerrarForm();
  }

  async eliminar(p: Partido) {
    if (confirm('¿Eliminar este partido?')) {
      this.partidos = this.partidos.filter((x) => x.id !== p.id);
      await this.guardarPartidos();
      this.rebuildVista();
      this.cerrarForm();
    }
  }

  async cargarFixture() {
    if (confirm('¿Cargar el fixture completo? Se reemplazarán los partidos actuales.')) {
      this.partidos = PARTIDOS_INICIALES.map((p, i) => ({ ...p, id: i + 1 }));
      await this.guardarPartidos();
      this.rebuildVista();
    }
  }

  agregarDesdeFixture(f: PartidoFixture) {
    this.editingPartido = null;
    this.form = {
      local: f.local,
      visitante: f.visitante,
      golesLocal: 0,
      golesVisitante: 0,
      estado: 'por-jugar',
      minuto: 0,
      fecha: f.fecha
    };
    this.showForm = true;
  }

  /** Para la tarjeta: datos a mostrar (resultado guardado o solo fixture) */
  localMostrar(item: PartidoResultadoVista): string {
    return item.partido?.local ?? item.fixture.local;
  }

  visitanteMostrar(item: PartidoResultadoVista): string {
    return item.partido?.visitante ?? item.fixture.visitante;
  }
}
