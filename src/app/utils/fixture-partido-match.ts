import { PartidoFixture } from '../data/fixture.data';
import { Partido } from '../data/partido.model';

export function nombresEquiposIguales(a: string, b: string): boolean {
  const ta = a.trim().toLowerCase();
  const tb = b.trim().toLowerCase();
  if (ta === tb) return true;
  const esCac = (s: string) => s.includes('canalense');
  return esCac(ta) && esCac(tb);
}

export function partidoCoincideConFixture(p: Partido, f: PartidoFixture): boolean {
  if ((p.fecha || '') !== f.fecha) return false;
  return (
    nombresEquiposIguales(p.local, f.local) &&
    nombresEquiposIguales(p.visitante, f.visitante)
  );
}

export function buscarPartidoCoincidente(
  partidos: Partido[],
  f: PartidoFixture
): Partido | undefined {
  return partidos.find((p) => partidoCoincideConFixture(p, f));
}
