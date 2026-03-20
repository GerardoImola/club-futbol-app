import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { mensajeErrorRed } from '../utils/supabase-errors';

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

@Injectable({ providedIn: 'root' })
export class SocioAuthService {
  socio = signal<Socio | null>(null);
  cuotasPagadas: Cuota[] = [];
  cuotasAdeudadas: Cuota[] = [];
  private _initDone = false;

  isLoggedIn = computed(() => this.socio() !== null);

  constructor(private supabase: SupabaseService) {}

  async init() {
    if (this._initDone) return;
    this._initDone = true;

    const client = this.supabase.client;
    if (!client) return;

    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      await this.cargarSocio(session.user.id);
    }

    client.auth.onAuthStateChange(async (_, newSession) => {
      if (newSession?.user) {
        await this.cargarSocio(newSession.user.id);
      } else {
        this.socio.set(null);
        this.cuotasPagadas = [];
        this.cuotasAdeudadas = [];
      }
    });
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
      if (error) return { error: error.message };
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

    if (error) return { error: error.message };
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
      monto: 5000,
      pagada: false
    });
  }

  async logout() {
    await this.supabase.client?.auth.signOut();
    this.socio.set(null);
    this.cuotasPagadas = [];
    this.cuotasAdeudadas = [];
  }
}
