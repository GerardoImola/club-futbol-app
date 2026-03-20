import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FIXTURE, PartidoFixture } from '../data/fixture.data';

export interface FixtureLoadResult {
  partidos: PartidoFixture[];
  /** null = todo OK desde BD o fallback sin aviso */
  aviso: string | null;
}

@Injectable({ providedIn: 'root' })
export class FixtureService {
  constructor(private supabase: SupabaseService) {}

  async loadFixture(): Promise<FixtureLoadResult> {
    const fallback = (): FixtureLoadResult => ({
      partidos: [...FIXTURE],
      aviso: null
    });

    if (!this.supabase.isConfigured || !this.supabase.client) {
      return fallback();
    }

    const { data, error } = await this.supabase.client
      .from('fixture_partidos')
      .select('local, visitante, fecha')
      .order('orden', { ascending: true });

    if (error) {
      return {
        partidos: [...FIXTURE],
        aviso: 'No se pudo leer el fixture desde la base. Mostrando calendario local.'
      };
    }

    if (!data?.length) {
      return {
        partidos: [...FIXTURE],
        aviso: 'El fixture en la base está vacío. Ejecutá supabase-fixture.sql o editá la tabla fixture_partidos.'
      };
    }

    return {
      partidos: data.map((row) => ({
        local: row.local as string,
        visitante: row.visitante as string,
        fecha: row.fecha as string
      })),
      aviso: null
    };
  }
}
