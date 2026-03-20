import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PartidoFixture } from '../../data/fixture.data';
import { Partido } from '../../data/partido.model';
import { FixtureService } from '../../services/fixture.service';
import { AuthService } from '../../services/auth.service';
import { ResultadosStorageService } from '../../services/resultados-storage.service';
import { buscarPartidoCoincidente } from '../../utils/fixture-partido-match';
import {
  calcularTablaPosiciones,
  esEquipoCanalense,
  FilaPosicion
} from '../../utils/tabla-posiciones';

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './fixture.component.html',
  styleUrl: './fixture.component.css'
})
export class FixtureComponent implements OnInit {
  fixture: PartidoFixture[] = [];
  /** Copia en memoria para mostrar marcadores (se refresca al guardar) */
  partidos: Partido[] = [];
  /** Borradores de goles por fila (solo admin) */
  drafts: Record<string, { gl: number; gv: number }> = {};
  cargando = true;
  aviso: string | null = null;

  /** Pestaña: partidos o tabla de posiciones */
  vista: 'fixture' | 'posiciones' = 'fixture';

  constructor(
    private fixtureService: FixtureService,
    public auth: AuthService,
    private resultadosStorage: ResultadosStorageService
  ) {}

  async ngOnInit() {
    this.cargando = true;
    await this.resultadosStorage.hydrateFromRemote();
    const res = await this.fixtureService.loadFixture();
    this.fixture = res.partidos;
    this.aviso = res.aviso;
    this.refreshPartidos();
    this.initDrafts();
    this.cargando = false;
  }

  rowKey(p: PartidoFixture): string {
    return `${p.fecha}|||${p.local}|||${p.visitante}`;
  }

  refreshPartidos(): void {
    this.partidos = this.resultadosStorage.getPartidos();
  }

  initDrafts(): void {
    this.drafts = {};
    for (const p of this.fixture) {
      const k = this.rowKey(p);
      const partido = this.partidoPara(p);
      this.drafts[k] = {
        gl: partido?.golesLocal ?? 0,
        gv: partido?.golesVisitante ?? 0
      };
    }
  }

  partidoPara(p: PartidoFixture): Partido | undefined {
    return buscarPartidoCoincidente(this.partidos, p);
  }

  /** Marcador para visitantes: solo si hay resultado cargado (final o en vivo) */
  tieneMarcador(p: PartidoFixture): boolean {
    const x = this.partidoPara(p);
    return !!x && (x.estado === 'finalizado' || x.estado === 'en-vivo');
  }

  async guardarFinal(p: PartidoFixture): Promise<void> {
    const k = this.rowKey(p);
    const d = this.drafts[k];
    if (!d) return;
    await this.resultadosStorage.upsertResultadoFinal(p, d.gl, d.gv);
    this.refreshPartidos();
    const partido = this.partidoPara(p);
    this.drafts[k] = {
      gl: partido?.golesLocal ?? d.gl,
      gv: partido?.golesVisitante ?? d.gv
    };
  }

  get fechas(): string[] {
    return [...new Set(this.fixture.map((x) => x.fecha))];
  }

  partidosPorFecha(fecha: string): PartidoFixture[] {
    return this.fixture.filter((x) => x.fecha === fecha);
  }

  /** Tabla de posiciones (3-1-0) según resultados del fixture */
  get tablaPosiciones(): FilaPosicion[] {
    return calcularTablaPosiciones(this.fixture, this.partidos);
  }

  get hayPartidosEnTabla(): boolean {
    return this.tablaPosiciones.some((f) => f.pj > 0);
  }

  esCanalense(equipo: string): boolean {
    return esEquipoCanalense(equipo);
  }

  setVista(v: 'fixture' | 'posiciones'): void {
    this.vista = v;
  }
}
