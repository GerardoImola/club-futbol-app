import { Injectable } from '@angular/core';
import { PartidoFixture } from '../data/fixture.data';
import {
  Partido,
  PARTIDOS_INICIALES,
  RESULTADOS_STORAGE_KEY
} from '../data/partido.model';
import { buscarPartidoCoincidente, partidoCoincideConFixture } from '../utils/fixture-partido-match';

@Injectable({ providedIn: 'root' })
export class ResultadosStorageService {
  /** Lee siempre desde localStorage (otras pestañas / Fixture actualizan) */
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

  ensureInitialSeed(): void {
    try {
      if (!localStorage.getItem(RESULTADOS_STORAGE_KEY)) {
        this.savePartidos([...PARTIDOS_INICIALES]);
      }
    } catch {
      /* noop */
    }
  }

  savePartidos(partidos: Partido[]): void {
    localStorage.setItem(RESULTADOS_STORAGE_KEY, JSON.stringify(partidos));
  }

  findByFixture(f: PartidoFixture): Partido | undefined {
    return buscarPartidoCoincidente(this.getPartidos(), f);
  }

  nextId(partidos: Partido[]): number {
    const max = partidos.reduce((m, p) => Math.max(m, p.id), 0);
    return max + 1;
  }

  /**
   * Crea o actualiza el resultado como finalizado; alinea nombres con el fixture (Supabase).
   */
  upsertResultadoFinal(
    f: PartidoFixture,
    golesLocal: number,
    golesVisitante: number
  ): void {
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
    this.savePartidos(partidos);
  }
}
