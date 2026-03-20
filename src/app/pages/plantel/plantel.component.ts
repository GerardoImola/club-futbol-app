import { Component } from '@angular/core';

/** Plantel — Nº (camiseta), DNI, apellido y nombre */
interface Jugador {
  numero: number;
  dni: string;
  apellido: string;
  nombre: string;
}

interface LineaCuerpoTecnico {
  rol: string;
  nombres: string;
}

/** Una categoría de inferiores con plantel completo */
interface CategoriaInferior {
  id: string;
  titulo: string;
  /** Texto bajo el título en la lista (ej. cantidad de jugadores) */
  resumen: string;
  cuerpoTecnico: LineaCuerpoTecnico[];
  jugadores: Jugador[];
}

@Component({
  selector: 'app-plantel',
  standalone: true,
  templateUrl: './plantel.component.html',
  styleUrl: './plantel.component.css'
})
export class PlantelComponent {
  categoriaSeleccionada: 'primera' | 'inferiores' = 'primera';

  /** En inferiores: null = lista de categorías; id = detalle */
  inferiorSeleccionadoId: string | null = null;

  /**
   * Datos según nómina (columna Nº, DNI, apellido, nombre).
   * Sin Nº escrito en la lista: se asignaron 19–33 en orden de aparición.
   */
  private primeraRaw: Jugador[] = [
    { numero: 1, dni: '40572686', apellido: 'Castillo', nombre: 'Kevin Emiliano' },
    { numero: 8, dni: '42440620', apellido: 'Castillo', nombre: 'Iván Mateo' },
    { numero: 3, dni: '42184374', apellido: 'Torres', nombre: 'Kevin' },
    { numero: 4, dni: '45094389', apellido: 'Brites', nombre: 'Joaquín' },
    { numero: 5, dni: '40921824', apellido: 'Montoya', nombre: 'Andrés A.' },
    { numero: 6, dni: '41377571', apellido: 'Barroso', nombre: 'Maico' },
    { numero: 7, dni: '42184346', apellido: 'Ledezma', nombre: 'Lautaro' },
    { numero: 20, dni: '42184375', apellido: 'Castro', nombre: 'Fernando Nicolás' },
    { numero: 9, dni: '37165704', apellido: 'Beneito', nombre: 'Nicolás' },
    { numero: 10, dni: '42891718', apellido: 'Mansilla', nombre: 'Pablo José' },
    { numero: 11, dni: '47321370', apellido: 'Reges', nombre: 'Federico' },
    { numero: 12, dni: '48326565', apellido: 'Suárez', nombre: 'Thiago Lisandro' },
    { numero: 2, dni: '40921801', apellido: 'López', nombre: 'Leonardo' },
    { numero: 14, dni: '37521872', apellido: 'Tomassoni', nombre: 'Lucas Fermani' },
    { numero: 13, dni: '47911430', apellido: 'Soldevila Morone', nombre: 'José' },
    { numero: 19, dni: '48326574', apellido: 'Gómez Spies', nombre: 'Agustín' },
    { numero: 21, dni: '33797170', apellido: 'Ibarborde', nombre: 'Juan Manuel' },
    { numero: 18, dni: '38479216', apellido: 'Montoya', nombre: 'Fernando' },
    { numero: 16, dni: '45405090', apellido: 'Amaya', nombre: 'Maximiliano' },
    { numero: 15, dni: '41769496', apellido: 'Gómez', nombre: 'Tomás' },
    { numero: 22, dni: '49287453', apellido: 'Martínez', nombre: 'Bautista' },
    { numero: 17, dni: '48326446', apellido: 'Rumisky', nombre: 'Ever' },
    { numero: 23, dni: '45698797', apellido: 'Mollina', nombre: 'Mauricio' },
    { numero: 24, dni: '41377567', apellido: 'López', nombre: 'David Esteban' },
    { numero: 25, dni: '46718553', apellido: 'Ligorria', nombre: 'Alexis' },
    { numero: 26, dni: '48860268', apellido: 'Magnasco', nombre: 'Bautista' },
    { numero: 27, dni: '46886762', apellido: 'Schiel', nombre: 'Alberto Rafael' },
    { numero: 28, dni: '48326509', apellido: 'Tomassoni Gigli', nombre: 'Bernabé Jesús' },
    { numero: 29, dni: '49223021', apellido: 'Tirimacco', nombre: 'Matías' },
    { numero: 30, dni: '48903675', apellido: 'Bubaraque', nombre: 'Benjamín' },
    { numero: 31, dni: '49223004', apellido: 'Menichetti Zilkovsky', nombre: 'Genaro' },
    { numero: 32, dni: '48326495', apellido: 'Villarreal', nombre: 'Valentín' },
    { numero: 33, dni: '44975303', apellido: 'Ledezma', nombre: 'Lázaro' }
  ];

  /** Vista ordenada por número de camiseta */
  get primera(): Jugador[] {
    return [...this.primeraRaw].sort((a, b) => a.numero - b.numero);
  }

  /** Categorías inferiores: editá jugadores y cuerpo técnico aquí */
  inferioresCategorias: CategoriaInferior[] = [
    {
      id: 'sub18',
      titulo: 'Sub-18',
      resumen: '22 jugadores',
      cuerpoTecnico: [
        { rol: 'Director técnico', nombres: 'A definir' },
        { rol: 'Asistente', nombres: 'A definir' },
        { rol: 'Preparador físico', nombres: 'A definir' }
      ],
      jugadores: [
        { numero: 1, dni: '—', apellido: 'Apellido', nombre: 'Nombre' },
        { numero: 2, dni: '—', apellido: 'Apellido', nombre: 'Nombre' },
        { numero: 3, dni: '—', apellido: 'Apellido', nombre: 'Nombre' }
      ]
    },
    {
      id: 'sub16',
      titulo: 'Sub-16',
      resumen: '20 jugadores',
      cuerpoTecnico: [
        { rol: 'Director técnico', nombres: 'A definir' },
        { rol: 'Asistente', nombres: 'A definir' }
      ],
      jugadores: [
        { numero: 1, dni: '—', apellido: 'Apellido', nombre: 'Nombre' },
        { numero: 2, dni: '—', apellido: 'Apellido', nombre: 'Nombre' }
      ]
    },
    {
      id: 'sub14',
      titulo: 'Sub-14',
      resumen: '18 jugadores',
      cuerpoTecnico: [
        { rol: 'Director técnico', nombres: 'A definir' },
        { rol: 'Asistente', nombres: 'A definir' }
      ],
      jugadores: [
        { numero: 1, dni: '—', apellido: 'Apellido', nombre: 'Nombre' }
      ]
    }
  ];

  get inferiorActual(): CategoriaInferior | undefined {
    return this.inferioresCategorias.find((c) => c.id === this.inferiorSeleccionadoId);
  }

  seleccionarTab(tab: 'primera' | 'inferiores'): void {
    this.categoriaSeleccionada = tab;
    if (tab === 'inferiores') {
      this.inferiorSeleccionadoId = null;
    }
  }

  abrirCategoriaInferior(id: string): void {
    this.inferiorSeleccionadoId = id;
  }

  volverListaInferiores(): void {
    this.inferiorSeleccionadoId = null;
  }
}
