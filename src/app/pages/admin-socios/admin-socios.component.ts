import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { environment } from '../../../environments/environment';

export interface SocioListado {
  id: string;
  numero_socio: number;
  nombre: string;
  telefono: string | null;
  created_at: string | null;
  /** null si la RPC aún no devuelve resumen (list_socios_admin vieja en Supabase). */
  cuotas_pendientes: number | null;
  cuotas_total: number | null;
}

@Component({
  selector: 'app-admin-socios',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './admin-socios.component.html',
  styleUrl: './admin-socios.component.css'
})
export class AdminSociosComponent implements OnInit {
  socios = signal<SocioListado[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  sociosSeleccionados = signal<Set<string>>(new Set());

  bulkSociosBusy = signal(false);
  mensajeExito = signal<string | null>(null);
  /** false cuando PostgREST devuelve list_socios_admin sin cuotas_total (hay que actualizar el SQL). */
  resumenCuotasDisponible = signal(true);

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    await this.cargarSocios();
  }

  private async cargarSocios(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    const client = this.supabase.client;
    if (!this.supabase.isConfigured || !client) {
      this.error.set('Supabase no está configurado.');
      this.cargando.set(false);
      return;
    }

    const { data, error } = await client.rpc('list_socios_admin', {
      p_admin_password: environment.adminPassword
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Unauthorized') || error.code === '42501') {
        this.error.set('No autorizado. Verificá la contraseña de admin en environment y en resultados_admin_secret.');
      } else if (msg.includes('function') && msg.includes('does not exist')) {
        this.error.set(
          'Falta ejecutar supabase-socios-admin-rpc.sql (o supabase-resultados.sql) en el SQL Editor de Supabase.'
        );
      } else {
        this.error.set(msg || 'No se pudo cargar la lista de socios.');
      }
      this.socios.set([]);
      this.cargando.set(false);
      return;
    }

    const raw = (data || []) as Array<Record<string, unknown>>;
    const tieneResumen = raw.length === 0 || ('cuotas_total' in raw[0] && raw[0]['cuotas_total'] != null);
    this.resumenCuotasDisponible.set(tieneResumen);

    const rows: SocioListado[] = raw.map((r) => ({
      id: String(r['id']),
      numero_socio: Number(r['numero_socio']),
      nombre: String(r['nombre'] ?? ''),
      telefono: r['telefono'] != null ? String(r['telefono']) : null,
      created_at: r['created_at'] != null ? String(r['created_at']) : null,
      cuotas_pendientes: tieneResumen ? Number(r['cuotas_pendientes'] ?? 0) : null,
      cuotas_total: tieneResumen ? Number(r['cuotas_total'] ?? 0) : null
    }));
    this.socios.set(rows);
    this.cargando.set(false);
  }

  etiquetaEstadoCuota(s: SocioListado): 'nd' | 'sin' | 'pagado' | 'pendiente' {
    if (s.cuotas_total == null || s.cuotas_pendientes == null) return 'nd';
    if (s.cuotas_total <= 0) return 'sin';
    if (s.cuotas_pendientes <= 0) return 'pagado';
    return 'pendiente';
  }

  textoEstadoCuota(s: SocioListado): string {
    const e = this.etiquetaEstadoCuota(s);
    if (e === 'nd') return 'N/D';
    if (e === 'sin') return 'Sin cuotas';
    if (e === 'pagado') return 'Pagado';
    const p = s.cuotas_pendientes ?? 0;
    return p === 1 ? '1 pendiente' : `${p} pendientes`;
  }

  /** Solo socios con cuota impaga (pendiente). */
  socioConDeuda(s: SocioListado): boolean {
    return this.etiquetaEstadoCuota(s) === 'pendiente';
  }

  private idsSociosConDeuda(): string[] {
    return this.socios().filter((s) => this.socioConDeuda(s)).map((s) => s.id);
  }

  haySociosConDeuda(): boolean {
    return this.idsSociosConDeuda().length > 0;
  }

  cantidadSociosSeleccionados(): number {
    return this.sociosSeleccionados().size;
  }

  socioEstaSeleccionado(id: string): boolean {
    return this.sociosSeleccionados().has(id);
  }

  toggleSocioSeleccion(s: SocioListado, event?: Event): void {
    event?.stopPropagation();
    if (!this.socioConDeuda(s)) return;
    this.mensajeExito.set(null);
    const next = new Set(this.sociosSeleccionados());
    if (next.has(s.id)) next.delete(s.id);
    else next.add(s.id);
    this.sociosSeleccionados.set(next);
  }

  todosPendientesSeleccionados(): boolean {
    const pend = this.idsSociosConDeuda();
    if (pend.length === 0) return false;
    const sel = this.sociosSeleccionados();
    return pend.every((id) => sel.has(id));
  }

  toggleSeleccionarTodosPendientes(): void {
    this.mensajeExito.set(null);
    const pend = this.idsSociosConDeuda();
    if (pend.length === 0) return;

    const next = new Set(this.sociosSeleccionados());
    if (this.todosPendientesSeleccionados()) {
      pend.forEach((id) => next.delete(id));
    } else {
      pend.forEach((id) => next.add(id));
    }
    this.sociosSeleccionados.set(next);
  }

  limpiarSeleccionSocios(): void {
    this.sociosSeleccionados.set(new Set());
  }

  private rpcFaltaCuotasAdmin(msg: string): boolean {
    return (
      msg.includes('marcar_pendientes_socios_admin') ||
      (msg.includes('function') && msg.includes('does not exist'))
    );
  }

  async marcarPendientesSeleccionados(): Promise<void> {
    const ids = [...this.sociosSeleccionados()];
    if (ids.length === 0) return;

    const ok = confirm(
      `Se marcarán como PAGADAS todas las cuotas pendientes de ${ids.length} socio(s) ` +
        `(cada socio puede tener más de un mes pendiente). ¿Confirmás?`
    );
    if (!ok) return;

    const client = this.supabase.client;
    if (!client) return;

    this.bulkSociosBusy.set(true);
    this.mensajeExito.set(null);

    const { data, error } = await client.rpc('marcar_pendientes_socios_admin', {
      p_admin_password: environment.adminPassword,
      p_socio_ids: ids
    });

    this.bulkSociosBusy.set(false);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Unauthorized') || error.code === '42501') {
        this.mensajeExito.set(null);
        alert('No autorizado.');
      } else if (this.rpcFaltaCuotasAdmin(msg)) {
        alert(
          'Falta ejecutar supabase-cuotas-admin-rpc.sql (marcar_pendientes_socios_admin).'
        );
      } else {
        alert(msg || 'No se pudo actualizar.');
      }
      return;
    }

    const n = typeof data === 'number' ? data : parseInt(String(data), 10) || 0;
    this.mensajeExito.set(
      n === 0
        ? 'No había cuotas pendientes para los socios seleccionados.'
        : `Se marcaron ${n} cuota(s) pendiente(s) como pagadas.`
    );
    this.sociosSeleccionados.set(new Set());
    await this.cargarSocios();
  }
}
