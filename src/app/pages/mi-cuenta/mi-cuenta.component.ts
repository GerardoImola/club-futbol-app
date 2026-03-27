import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SocioAuthService, Cuota, MONTO_CUOTA_PESOS } from '../../services/socio-auth.service';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.css'
})
export class MiCuentaComponent implements OnInit {
  /** Cuota mensual vigente (mostrar siempre este valor para pendientes y pago). */
  readonly montoCuotaPesos = MONTO_CUOTA_PESOS;

  constructor(
    public socioAuth: SocioAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.socioAuth.init();
  }

  get socio() {
    return this.socioAuth.socio();
  }

  get cuotasPagadas(): Cuota[] {
    return this.socioAuth.cuotasPagadas;
  }

  get cuotasAdeudadas(): Cuota[] {
    return this.socioAuth.cuotasAdeudadas;
  }

  get cuotaPendiente(): boolean {
    return this.cuotasAdeudadas.length > 0;
  }

  formatearMes(mes: number, anio: number): string {
    return `${MESES[mes - 1]} ${anio}`;
  }

  async cerrarSesion(): Promise<void> {
    await this.socioAuth.logout();
    await this.router.navigateByUrl('/socios/login');
  }
}
