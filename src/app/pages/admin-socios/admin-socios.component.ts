import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { environment } from '../../../environments/environment';

export interface SocioListado {
  id: string;
  numero_socio: number;
  nombre: string;
  email: string;
  telefono: string | null;
  created_at: string | null;
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

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
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
          'Falta ejecutar supabase-socios-admin-rpc.sql en el SQL Editor de Supabase.'
        );
      } else {
        this.error.set(msg || 'No se pudo cargar la lista de socios.');
      }
      this.socios.set([]);
      this.cargando.set(false);
      return;
    }

    const rows = (data || []) as SocioListado[];
    this.socios.set(rows);
    this.cargando.set(false);
  }
}
