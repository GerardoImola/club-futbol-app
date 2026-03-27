import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { mensajeErrorRed, traducirErrorAuthSupabase } from '../utils/supabase-errors';

export interface Socio {
  id: string;
  numero_socio: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface Cuota {
  id: string;
  mes: number;
  anio: number;
  monto: number;
  pagada: boolean;
  fecha_pago?: string;
}

/** Monto vigente de la cuota mensual (pesos). Una sola fuente para alta en BD y pantalla. */
export const MONTO_CUOTA_PESOS = 10000;

@Injectable({ providedIn: 'root' })
export class SocioAuthService {
  socio = signal<Socio | null>(null);
  cuotasPagadas: Cuota[] = [];
  cuotasAdeudadas: Cuota[] = [];
  private _initDone = false;

  /** true después del primer getSession en init (para no mostrar "Cargando" cuando no hay sesión) */
  cuentaBootstrapDone = signal(false);
  /** Sesión de recuperación: el usuario debe elegir contraseña nueva (enlace del email) */
  enRecuperacionPassword = signal(false);
  /** Hay sesión JWT en Supabase (alineado con socioAuthGuard) */
  sesionActiva = signal(false);

  isLoggedIn = computed(() => this.socio() !== null);

  constructor(private supabase: SupabaseService) {}

  async init() {
    if (this._initDone) {
      this.cuentaBootstrapDone.set(true);
      return;
    }
    this._initDone = true;

    const client = this.supabase.client;
    if (!client) {
      this.sesionActiva.set(false);
      this.cuentaBootstrapDone.set(true);
      return;
    }

    // No await de cargarSocio: GoTrueClient._notifyAllSubscribers espera a los callbacks;
    // si la consulta a `socios`/cuotas tarda o falla en red, signInWithPassword quedaría colgado.
    client.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.enRecuperacionPassword.set(true);
        this.sesionActiva.set(!!newSession);
        return;
      }
      this.enRecuperacionPassword.set(false);
      this.sesionActiva.set(!!newSession);

      if (newSession?.user) {
        void this.cargarSocio(newSession.user.id);
      } else {
        this.socio.set(null);
        this.cuotasPagadas = [];
        this.cuotasAdeudadas = [];
      }
    });

    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      this.sesionActiva.set(!!session);
      if (session?.user) {
        void this.cargarSocio(session.user.id);
      }
    } finally {
      this.cuentaBootstrapDone.set(true);
    }
  }

  private async cargarSocio(userId: string) {
    const client = this.supabase.client;
    if (!client) return;

    const { data: socioData, error: socioError } = await client
      .from('socios')
      .select('*')
      .eq('id', userId)
      .single();

    if (socioError || !socioData) {
      this.socio.set(null);
      return;
    }

    this.socio.set({
      id: socioData.id,
      numero_socio: socioData.numero_socio,
      nombre: socioData.nombre,
      email: socioData.email,
      telefono: socioData.telefono
    });

    await this.cargarCuotas(userId);
  }

  private async cargarCuotas(socioId: string) {
    const client = this.supabase.client;
    if (!client) return;

    const { data: cuotasData } = await client
      .from('cuotas')
      .select('*')
      .eq('socio_id', socioId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });

    this.cuotasPagadas = (cuotasData || [])
      .filter((c: { pagada: boolean }) => c.pagada)
      .map((c: { id: string; mes: number; anio: number; monto: number; fecha_pago?: string }) => ({
        id: c.id,
        mes: c.mes,
        anio: c.anio,
        monto: c.monto,
        pagada: true,
        fecha_pago: c.fecha_pago
      }));

    this.cuotasAdeudadas = (cuotasData || [])
      .filter((c: { pagada: boolean }) => !c.pagada)
      .map((c: { id: string; mes: number; anio: number; monto: number }) => ({
        id: c.id,
        mes: c.mes,
        anio: c.anio,
        monto: c.monto,
        pagada: false
      }));
  }

  async login(email: string, password: string): Promise<{ error?: string }> {
    const client = this.supabase.client;
    if (!client) return { error: 'Base de datos no configurada' };

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: traducirErrorAuthSupabase(error) };
      if (!data.user) return { error: 'Error al iniciar sesión' };
      return {};
    } catch (e) {
      return { error: mensajeErrorRed(e) };
    }
  }

  async registro(
    email: string,
    password: string,
    nombre: string,
    telefono?: string
  ): Promise<{ error?: string; pendienteEmail?: boolean; mensaje?: string }> {
    const client = this.supabase.client;
    if (!client) return { error: 'Base de datos no configurada' };

    let data: Awaited<ReturnType<typeof client.auth.signUp>>['data'];
    let error: Awaited<ReturnType<typeof client.auth.signUp>>['error'];
    try {
      const res = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            telefono: (telefono || '').trim()
          }
        }
      });
      data = res.data;
      error = res.error;
    } catch (e) {
      return { error: mensajeErrorRed(e) };
    }

    if (error) return { error: traducirErrorAuthSupabase(error) };
    if (!data.user) return { error: 'Error al registrarse' };

    // Ideal: trigger en BD (supabase-registro-trigger.sql). Si hay sesión y falló el trigger, insert acá.
    if (data.session) {
      await this.asegurarSocioEnBd(data.user.id, email, nombre, telefono);
      await this.cargarSocio(data.user.id);
      return {};
    }

    return {
      pendienteEmail: true,
      mensaje:
        'Te enviamos un correo para confirmar la cuenta. Cuando lo confirmes, ingresá con tu email y contraseña. Tu número de socio ya quedó asignado en el club.'
    };
  }

  /** Si el trigger no está instalado, crea socio + cuota con la sesión actual */
  private async asegurarSocioEnBd(
    userId: string,
    email: string,
    nombre: string,
    telefono?: string
  ) {
    const client = this.supabase.client;
    if (!client) return;

    const { data: existente } = await client.from('socios').select('id').eq('id', userId).maybeSingle();
    if (existente) return;

    const { data: maxRow } = await client
      .from('socios')
      .select('numero_socio')
      .order('numero_socio', { ascending: false })
      .limit(1)
      .maybeSingle();

    const numeroSocio = (maxRow?.numero_socio ?? 0) + 1;
    const { error: e1 } = await client.from('socios').insert({
      id: userId,
      numero_socio: numeroSocio,
      nombre: nombre.trim(),
      email,
      telefono: telefono?.trim() || null
    });
    if (e1) return;

    const hoy = new Date();
    await client.from('cuotas').insert({
      socio_id: userId,
      mes: hoy.getMonth() + 1,
      anio: hoy.getFullYear(),
      monto: MONTO_CUOTA_PESOS,
      pagada: false
    });
  }

  /**
   * Cierra sesión en el dispositivo. Usa scope local para no depender de red
   * (signOut global a veces queda colgado si falla la revocación en el servidor).
   */
  async logout(): Promise<void> {
    this.socio.set(null);
    this.cuotasPagadas = [];
    this.cuotasAdeudadas = [];
    this.enRecuperacionPassword.set(false);
    this.sesionActiva.set(false);

    const client = this.supabase.client;
    if (!client) return;

    try {
      await client.auth.signOut({ scope: 'local' });
    } catch {
      /* sesión local igualmente limpiada arriba */
    }
  }

  /** Envía email con enlace para restablecer contraseña (configurá redirect en Supabase Auth) */
  async resetPasswordForEmail(email: string): Promise<{ error?: string }> {
    const client = this.supabase.client;
    if (!client) return { error: 'Base de datos no configurada' };
    const redirectTo =
      typeof globalThis !== 'undefined' && globalThis.location?.origin
        ? `${globalThis.location.origin}/socios/login`
        : undefined;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });
      if (error) return { error: traducirErrorAuthSupabase(error) };
      return {};
    } catch (e) {
      return { error: mensajeErrorRed(e) };
    }
  }

  /** Tras abrir el enlace del email de recuperación */
  async actualizarPasswordRecuperacion(password: string): Promise<{ error?: string }> {
    const client = this.supabase.client;
    if (!client) return { error: 'Base de datos no configurada' };
    if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) return { error: traducirErrorAuthSupabase(error) };
      this.enRecuperacionPassword.set(false);
      const uid = (await client.auth.getUser()).data.user?.id;
      if (uid) await this.cargarSocio(uid);
      return {};
    } catch (e) {
      return { error: mensajeErrorRed(e) };
    }
  }
}
