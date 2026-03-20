import { Component } from '@angular/core';

interface Noticia {
  id: number;
  titulo: string;
  resumen: string;
  fecha: string;
  /** Párrafo inicial (notas largas) */
  intro?: string;
  /** Lista de logros con emoji opcional en el texto */
  logros?: string[];
  /** Párrafo final */
  cierre?: string;
}

@Component({
  selector: 'app-noticias',
  standalone: true,
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css'
})
export class NoticiasComponent {
  /** id de noticia → expandida (texto completo) */
  expandido: Record<number, boolean> = {};

  toggleNoticia(id: number): void {
    this.expandido[id] = !this.expandido[id];
  }

  estaExpandida(id: number): boolean {
    return !!this.expandido[id];
  }

  noticias: Noticia[] = [
    {
      id: 4,
      titulo: 'Nueve títulos y una temporada histórica',
      resumen:
        'Canalense se consagró como el club más ganador del fútbol 2025, con nueve campeonatos en todas las categorías.',
      fecha: '2025-03-10',
      intro:
        'El verde llenó sus vitrinas de trofeos y escribió una página inolvidable en su historia. Con 9 títulos obtenidos, Canalense se convirtió en el club más ganador de la temporada de fútbol 2025:',
      logros: [
        '🏆 Campeón Clausura en 1ª División',
        '🏆 Campeón Finalísima en 1ª División',
        '🏆 Campeón Copa Córdoba Clasificación',
        '🏆 Campeón Categoría 2012 – Torneo Apertura',
        '🏆 Campeón Categoría 2012 – Finalísima',
        '🏆 Campeón Categoría 2015 – Torneo Clausura',
        '🏆 Campeón Categoría 2015 – Finalísima',
        '🏆 Campeón Categoría 2017 – Torneo Clausura',
        '🏆 Campeón Categoría 2017 – Finalísima'
      ],
      cierre:
        'Un año que quedará grabado para siempre, fruto del trabajo, el compromiso y el sentido de pertenencia de jugadores, cuerpos técnicos, dirigentes y de toda una comunidad que empuja siempre para el mismo lado.'
    },
    {
      id: 1,
      titulo: 'Victoria en el clásico',
      resumen:
        'El primer equipo se impuso por 2-1 en un partido vibrante. Goles de Martínez y López.',
      fecha: '2025-03-15'
    },
    {
      id: 2,
      titulo: 'Nuevo refuerzo para inferiores',
      resumen:
        'Se suma al plantel sub-18 un prometedor mediocampista de la zona.',
      fecha: '2025-03-14'
    },
    {
      id: 3,
      titulo: 'Próximo partido de local',
      resumen:
        'Este domingo recibimos al líder del torneo. ¡Te esperamos en la cancha!',
      fecha: '2025-03-13'
    }
  ];
}
