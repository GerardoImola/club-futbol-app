import { PartidoFixture } from '../data/fixture.data';
import { Partido } from '../data/partido.model';
import { buscarPartidoCoincidente } from './fixture-partido-match';

export interface FilaPosicion {
  /** Posición en la tabla (1 = primero) */
  pos: number;
  equipo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

/**
 * Tabla tipo liga: victoria 3 pts, empate 1, derrota 0.
 * Solo cuenta partidos del fixture con resultado (en vivo o finalizado), no "por jugar".
 */
export function calcularTablaPosiciones(
  fixture: PartidoFixture[],
  partidos: Partido[]
): FilaPosicion[] {
  const norm = (s: string) => s.trim();
  const equipos = new Set<string>();
  for (const f of fixture) {
    equipos.add(norm(f.local));
    equipos.add(norm(f.visitante));
  }

  const stats = new Map<
    string,
    { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number }
  >();
  for (const eq of equipos) {
    stats.set(eq, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 });
  }

  for (const f of fixture) {
    const p = buscarPartidoCoincidente(partidos, f);
    if (!p || p.estado === 'por-jugar') continue;

    const gl = Math.max(0, p.golesLocal ?? 0);
    const gv = Math.max(0, p.golesVisitante ?? 0);
    const nombreLocal = norm(f.local);
    const nombreVisit = norm(f.visitante);
    const sl = stats.get(nombreLocal)!;
    const sv = stats.get(nombreVisit)!;

    sl.pj += 1;
    sv.pj += 1;
    sl.gf += gl;
    sl.gc += gv;
    sv.gf += gv;
    sv.gc += gl;

    if (gl === gv) {
      sl.pe += 1;
      sv.pe += 1;
    } else if (gl > gv) {
      sl.pg += 1;
      sv.pp += 1;
    } else {
      sv.pg += 1;
      sl.pp += 1;
    }
  }

  const filas: FilaPosicion[] = [];
  for (const eq of equipos) {
    const s = stats.get(eq)!;
    const pts = s.pg * 3 + s.pe * 1;
    const dg = s.gf - s.gc;
    filas.push({
      pos: 0,
      equipo: eq,
      pj: s.pj,
      pg: s.pg,
      pe: s.pe,
      pp: s.pp,
      gf: s.gf,
      gc: s.gc,
      dg,
      pts
    });
  }

  filas.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.equipo.localeCompare(b.equipo, 'es');
  });

  filas.forEach((row, i) => {
    row.pos = i + 1;
  });

  return filas;
}

/** True si el nombre corresponde al club (para resaltar fila) */
export function esEquipoCanalense(nombre: string): boolean {
  return nombre.toLowerCase().includes('canalense');
}
