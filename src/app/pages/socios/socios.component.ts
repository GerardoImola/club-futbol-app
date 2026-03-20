import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './socios.component.html',
  styleUrl: './socios.component.css'
})
export class SociosComponent {
  beneficios = [
    'Descuentos en la tienda del club',
    'Acceso a eventos exclusivos',
    'Participación en asambleas',
    'Cuota mensual accesible'
  ];
}
