import { Component, HostListener, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SocioAuthService, Cuota, MONTO_CUOTA_PESOS } from '../../services/socio-auth.service';
import { environment } from '../../../environments/environment';
import { formatearNombreTitulo, NombreTituloPipe } from '../../pipes/nombre-titulo.pipe';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Tarjeta + Mercado Pago (misma opción) vs solo transferencia bancaria (modal). */
export type MetodoPagoCuota = 'digital' | 'transferencia';

/** Datos a mostrar/copiar; editá los `value` con los datos reales del club. */
export interface DatoTransferencia {
  id: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [DecimalPipe, RouterLink, NombreTituloPipe],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.css'
})
export class MiCuentaComponent implements OnInit {
  /** Cuota mensual vigente (mostrar siempre este valor para pendientes y pago). */
  readonly montoCuotaPesos = MONTO_CUOTA_PESOS;

  readonly metodoPago = signal<MetodoPagoCuota>('digital');

  /** Modal con CBU, alias, etc. */
  readonly modalTransferenciaAbierto = signal(false);

  /** Id del campo recién copiado (feedback “Copiado”). */
  readonly copiadoId = signal<string | null>(null);

  private copiadoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly datosTransferencia: DatoTransferencia[] = [
    { id: 'banco', label: 'Banco', value: 'Banco (indicá cuál)' },
    { id: 'titular', label: 'Titular', value: 'Titular de la cuenta' },
    { id: 'cbu', label: 'CBU', value: '0000000000000000000000' },
    { id: 'alias', label: 'Alias', value: 'club.cac.cuota' },
    { id: 'cuit', label: 'CUIT', value: '00-00000000-0' }
  ];

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

  /** Monto para textos tipo “Datos para transferir …” (formato local AR). */
  montoFormateadoAr(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.montoCuotaPesos);
  }

  seleccionarDigital(): void {
    this.metodoPago.set('digital');
    this.modalTransferenciaAbierto.set(false);
  }

  abrirModalTransferencia(): void {
    this.metodoPago.set('transferencia');
    this.modalTransferenciaAbierto.set(true);
  }

  cerrarModalTransferencia(): void {
    this.modalTransferenciaAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModal(): void {
    if (this.modalTransferenciaAbierto()) {
      this.cerrarModalTransferencia();
    }
  }

  /** Texto que se envía por WhatsApp para identificar el pago (el socio adjunta el comprobante en el chat). */
  armarTextoComprobanteWhatsApp(): string {
    const s = this.socio;
    if (!s) {
      return '';
    }
    const lineas = [
      'Hola, adjunto comprobante de pago de cuota.',
      '',
      `Socio Nº: ${s.numero_socio}`,
      `Nombre: ${formatearNombreTitulo(s.nombre)}`,
      `Monto: ${this.montoFormateadoAr()}`
    ];
    if (this.cuotasAdeudadas.length > 0) {
      const meses = this.cuotasAdeudadas.map((c) => this.formatearMes(c.mes, c.anio)).join(', ');
      lineas.push(`Cuota(s): ${meses}`);
    }
    lineas.push('', '(Mensaje generado desde la app del club — adjuntá captura o PDF del comprobante.)');
    return lineas.join('\n');
  }

  abrirWhatsAppComprobante(): void {
    const texto = this.armarTextoComprobanteWhatsApp();
    if (!texto) {
      return;
    }
    const encoded = encodeURIComponent(texto);
    const phone = (environment.clubWhatsApp || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async copiarDato(valor: string, id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(valor);
      if (this.copiadoTimer) {
        clearTimeout(this.copiadoTimer);
      }
      this.copiadoId.set(id);
      this.copiadoTimer = setTimeout(() => {
        this.copiadoId.set(null);
        this.copiadoTimer = null;
      }, 2000);
    } catch {
      alert('No se pudo copiar al portapapeles. Copiá el texto manualmente.');
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.socioAuth.logout();
    await this.router.navigateByUrl('/socios/login');
  }
}
