/** Resultado de partido guardado en localStorage (compartido entre Resultados y Fixture) */
export interface Partido {
  id: number;
  local: string;
  visitante: string;
  golesLocal: number;
  golesVisitante: number;
  estado: 'en-vivo' | 'finalizado' | 'por-jugar';
  minuto?: number;
  liveStartedAt?: number;
  fecha?: string;
}

export const RESULTADOS_STORAGE_KEY = 'cac_resultados_primera';

export const PARTIDOS_INICIALES: Partido[] = [
  { id: 1, local: 'Pabellón Arg.', visitante: 'Los Andes', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 2, local: 'Jorge Ross', visitante: 'Libertad', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 3, local: 'Belgrano Jrs.', visitante: 'A. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 4, local: 'Sp. La Cesira', visitante: 'Arias Football', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 5, local: 'Canalense', visitante: 'Central Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 6, local: 'B. Sarmiento', visitante: 'Colonia', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 15/03' },
  { id: 7, local: 'Libertad', visitante: 'Los Andes', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 8, local: 'A. Sarmiento', visitante: 'Pabellón Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 9, local: 'Arias Football', visitante: 'Jorge Ross', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 10, local: 'Central Arg.', visitante: 'Belgrano Jrs.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 11, local: 'B. Sarmiento', visitante: 'Sp. La Cesira', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 12, local: 'Colonia', visitante: 'Canalense', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 22/03' },
  { id: 13, local: 'Los Andes', visitante: 'Colonia', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 14, local: 'Canalense', visitante: 'B. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 15, local: 'Sp. La Cesira', visitante: 'Central Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 16, local: 'Belgrano Jrs.', visitante: 'Arias Football', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 17, local: 'Jorge Ross', visitante: 'A. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 18, local: 'Pabellón Arg.', visitante: 'Libertad', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 29/03' },
  { id: 19, local: 'Los Andes', visitante: 'Canalense', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 20, local: 'Sp. La Cesira', visitante: 'Colonia', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 21, local: 'Belgrano Jrs.', visitante: 'B. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 22, local: 'Jorge Ross', visitante: 'Central Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 23, local: 'Pabellón Arg.', visitante: 'Arias Football', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 24, local: 'Libertad', visitante: 'A. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 05/04' },
  { id: 25, local: 'A. Sarmiento', visitante: 'Los Andes', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 26, local: 'Arias Football', visitante: 'Libertad', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 27, local: 'Central Arg.', visitante: 'Pabellón Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 28, local: 'B. Sarmiento', visitante: 'Jorge Ross', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 29, local: 'Colonia', visitante: 'Belgrano Jrs.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 30, local: 'Canalense', visitante: 'Sp. La Cesira', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 12/04' },
  { id: 31, local: 'Central Arg.', visitante: 'Jorge Ross', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 32, local: 'Arias Football', visitante: 'Belgrano Jrs.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 33, local: 'Libertad', visitante: 'Canalense', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 34, local: 'Pabellón Arg.', visitante: 'Colonia', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 35, local: 'Sp. La Cesira', visitante: 'A. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 36, local: 'Los Andes', visitante: 'B. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 19/04' },
  { id: 37, local: 'Los Andes', visitante: 'Sp. La Cesira', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 38, local: 'Belgrano Jrs.', visitante: 'Canalense', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 39, local: 'Jorge Ross', visitante: 'Colonia', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 40, local: 'Pabellón Arg.', visitante: 'B. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 41, local: 'Libertad', visitante: 'Central Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 42, local: 'A. Sarmiento', visitante: 'Arias Football', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 26/04' },
  { id: 43, local: 'Arias Football', visitante: 'Los Andes', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
  { id: 44, local: 'Central Arg.', visitante: 'A. Sarmiento', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
  { id: 45, local: 'B. Sarmiento', visitante: 'Libertad', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
  { id: 46, local: 'Colonia', visitante: 'Pabellón Arg.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
  { id: 47, local: 'Canalense', visitante: 'Jorge Ross', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
  { id: 48, local: 'Sp. La Cesira', visitante: 'Belgrano Jrs.', golesLocal: 0, golesVisitante: 0, estado: 'por-jugar', fecha: 'Dom 03/05' },
];
