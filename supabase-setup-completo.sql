-- =============================================================================
-- CONFIGURACIÓN COMPLETA — Ejecutá TODO de una vez en Supabase
-- SQL Editor → New query → pegar → Run
-- =============================================================================

-- Tablas
create table if not exists public.socios (
  id uuid primary key references auth.users(id) on delete cascade,
  numero_socio integer not null unique,
  nombre text not null,
  email text not null,
  telefono text,
  created_at timestamptz default now()
);

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

create index if not exists idx_cuotas_socio on public.cuotas(socio_id);

-- RLS
alter table public.socios enable row level security;
alter table public.cuotas enable row level security;

drop policy if exists "Socios ven su propio perfil" on public.socios;
create policy "Socios ven su propio perfil"
  on public.socios for select
  using (auth.uid() = id);

drop policy if exists "Socios ven sus propias cuotas" on public.cuotas;
create policy "Socios ven sus propias cuotas"
  on public.cuotas for select
  using (auth.uid() = socio_id);

drop policy if exists "Usuarios pueden insertar su propio perfil" on public.socios;
create policy "Usuarios pueden insertar su propio perfil"
  on public.socios for insert
  with check (auth.uid() = id);

drop policy if exists "Usuarios pueden insertar cuotas propias" on public.cuotas;
create policy "Usuarios pueden insertar cuotas propias"
  on public.cuotas for insert
  with check (auth.uid() = socio_id);

-- Trigger: nuevos registros en Auth → socio + cuota automáticos
create or replace function public.handle_new_socio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num integer;
  v_nombre text;
  v_tel text;
  v_mes int;
  v_anio int;
begin
  select coalesce(max(numero_socio), 0) + 1 into v_num from public.socios;

  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
    split_part(new.email, '@', 1)
  );
  v_tel := nullif(trim(new.raw_user_meta_data->>'telefono'), '');

  insert into public.socios (id, numero_socio, nombre, email, telefono)
  values (new.id, v_num, v_nombre, coalesce(new.email, ''), v_tel)
  on conflict (id) do nothing;

  v_mes := extract(month from (now() at time zone 'America/Argentina/Buenos_Aires'))::int;
  v_anio := extract(year from (now() at time zone 'America/Argentina/Buenos_Aires'))::int;

  insert into public.cuotas (socio_id, mes, anio, monto, pagada)
  values (new.id, v_mes, v_anio, 5000, false)
  on conflict (socio_id, mes, anio) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_socio();

-- =============================================================================
-- Usuarios que ya se registraron ANTES de crear las tablas (como vos):
-- les creamos la fila en socios + cuota del mes.
-- =============================================================================
insert into public.socios (id, numero_socio, nombre, email, telefono)
select
  u.id,
  (select coalesce(max(s.numero_socio), 0) from public.socios s)
    + row_number() over (order by u.created_at),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'nombre'), ''),
    split_part(u.email, '@', 1)
  ),
  coalesce(u.email, ''),
  nullif(trim(u.raw_user_meta_data->>'telefono'), '')
from auth.users u
where not exists (select 1 from public.socios x where x.id = u.id)
on conflict (id) do nothing;

insert into public.cuotas (socio_id, mes, anio, monto, pagada)
select
  s.id,
  extract(month from (now() at time zone 'America/Argentina/Buenos_Aires'))::int,
  extract(year from (now() at time zone 'America/Argentina/Buenos_Aires'))::int,
  5000,
  false
from public.socios s
where not exists (
  select 1 from public.cuotas c
  where c.socio_id = s.id
    and c.mes = extract(month from (now() at time zone 'America/Argentina/Buenos_Aires'))::int
    and c.anio = extract(year from (now() at time zone 'America/Argentina/Buenos_Aires'))::int
)
on conflict (socio_id, mes, anio) do nothing;
