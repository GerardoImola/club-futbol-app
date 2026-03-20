import { Component } from '@angular/core';

interface FotoPlaceholder {
  id: number;
  titulo: string;
}

@Component({
  selector: 'app-galeria',
  standalone: true,
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css'
})
export class GaleriaComponent {
  readonly tituloFinalisima = 'Campeón Finalísima';

  /** Rutas bajo public/images/finalisima/ */
  imagenesFinalisima: { src: string; alt: string }[] = [
    { src: 'images/finalisima/galeria-01.svg', alt: 'Campeón Finalísima 1' },
    { src: 'images/finalisima/galeria-02.svg', alt: 'Campeón Finalísima 2' },
    { src: 'images/finalisima/galeria-03.svg', alt: 'Campeón Finalísima 3' },
    { src: 'images/finalisima/galeria-04.svg', alt: 'Campeón Finalísima 4' },
    { src: 'images/finalisima/galeria-05.svg', alt: 'Campeón Finalísima 5' },
    { src: 'images/finalisima/galeria-06.svg', alt: 'Campeón Finalísima 6' }
  ];

  lightboxIndex: number | null = null;

  fotos: FotoPlaceholder[] = [
    { id: 1, titulo: 'Celebración del gol' },
    { id: 2, titulo: 'Entrenamiento' },
    { id: 3, titulo: 'Presentación del plantel' },
    { id: 4, titulo: 'Partido de inferiores' },
    { id: 5, titulo: 'Hinchada en la cancha' },
    { id: 6, titulo: 'Vestuario' }
  ];

  abrirLightbox(i: number): void {
    this.lightboxIndex = i;
    document.body.style.overflow = 'hidden';
  }

  cerrarLightbox(): void {
    this.lightboxIndex = null;
    document.body.style.overflow = '';
  }

  anterior(): void {
    if (this.lightboxIndex === null) return;
    const n = this.imagenesFinalisima.length;
    this.lightboxIndex = (this.lightboxIndex - 1 + n) % n;
  }

  siguiente(): void {
    if (this.lightboxIndex === null) return;
    const n = this.imagenesFinalisima.length;
    this.lightboxIndex = (this.lightboxIndex + 1) % n;
  }
}
