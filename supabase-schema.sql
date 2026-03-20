-- Ejecutá este SQL en Supabase: SQL Editor > New query
-- https://supabase.com/dashboard/project/TU_PROYECTO/sql

-- Tabla socios (vinculada a auth.users)
create table if not exists public.socios (
  id uuid primary key references auth.users(id) on delete cascade,
  numero_socio integer not null unique,
  nombre text not null,
  email text not null,
  telefono text,
  created_at timestamptz default now()
);

-- Tabla cuotas
create table if not exists public.cuotas (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  mes integer not null check (mes >= 1 and mes <= 12),
  anio integer not null,
  monto numeric not null default 5000,
  pagada boolean not null default false,
  fecha_pago timestamptz,
  created_at timestamptz default now(),
  unique(socio_id, mes, anio)
);

-- Índices
create index if not exists idx_cuotas_socio on public.cuotas(socio_id);

-- RLS: cada socio solo ve sus datos
alter table public.socios enable row level security;
alter table public.cuotas enable row level security;

create policy "Socios ven su propio perfil"
  on public.socios for select
  using (auth.uid() = id);

create policy "Socios ven sus propias cuotas"
  on public.cuotas for select
  using (auth.uid() = socio_id);

-- El admin puede insertar/actualizar (configurar desde Supabase Dashboard si tenés rol admin)
-- Por ahora, el registro crea el socio desde la app con el usuario autenticado
create policy "Usuarios pueden insertar su propio perfil"
  on public.socios for insert
  with check (auth.uid() = id);

create policy "Usuarios pueden insertar cuotas propias"
  on public.cuotas for insert
  with check (auth.uid() = socio_id);

-- Registro automático: ejecutá también supabase-registro-trigger.sql
-- (crea socio + número + cuota al darse de alta en Auth)
