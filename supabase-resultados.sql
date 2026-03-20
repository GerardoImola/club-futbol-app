-- Resultados de partidos (compartidos entre PC, Vercel y celular)
-- Ejecutá en Supabase → SQL Editor (después de fixture_partidos si aplica).
-- La contraseña de escritura debe coincidir con environment.adminPassword de la app.

-- Secreto de admin (solo la función SECURITY DEFINER lee esta fila; anon no tiene acceso a la tabla)
create table if not exists public.resultados_admin_secret (
  id integer primary key check (id = 1),
  secret text not null
);

insert into public.resultados_admin_secret (id, secret)
values (1, 'cac2025')
on conflict (id) do nothing;

comment on table public.resultados_admin_secret is
  'Clave para RPC sync_partido_resultados. Cambiá con: update resultados_admin_secret set secret = ''tu_clave'' where id = 1;';

alter table public.resultados_admin_secret enable row level security;

revoke all on table public.resultados_admin_secret from anon, authenticated;
revoke all on table public.resultados_admin_secret from public;

create table if not exists public.partido_resultados (
  legacy_id integer not null unique,
  local text not null,
  visitante text not null,
  fecha text not null default '',
  goles_local smallint not null default 0,
  goles_visitante smallint not null default 0,
  estado text not null check (estado in ('en-vivo', 'finalizado', 'por-jugar')),
  minuto smallint,
  live_started_at bigint
);

create index if not exists idx_partido_resultados_legacy on public.partido_resultados (legacy_id);

alter table public.partido_resultados enable row level security;

drop policy if exists "Resultados lectura pública" on public.partido_resultados;
create policy "Resultados lectura pública"
  on public.partido_resultados
  for select
  to anon, authenticated
  using (true);

-- Permisos explícitos (sin esto PostgREST puede devolver 401/permission denied con RLS)
grant select on table public.partido_resultados to anon, authenticated, service_role;

-- Sin políticas de escritura directa: solo la RPC (SECURITY DEFINER)

create or replace function public.sync_partido_resultados(
  p_admin_password text,
  p_partidos jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select s.secret into expected
  from public.resultados_admin_secret s
  where s.id = 1;

  if expected is null or p_admin_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  -- Algunos proyectos (p. ej. reglas de Supabase) rechazan DELETE sin WHERE
  delete from public.partido_resultados where true;

  insert into public.partido_resultados (
    legacy_id, local, visitante, fecha, goles_local, goles_visitante, estado, minuto, live_started_at
  )
  select
    (x->>'legacy_id')::integer,
    coalesce(x->>'local', ''),
    coalesce(x->>'visitante', ''),
    coalesce(x->>'fecha', ''),
    greatest(0, least(99, coalesce((x->>'goles_local')::integer, 0))),
    greatest(0, least(99, coalesce((x->>'goles_visitante')::integer, 0))),
    (x->>'estado')::text,
    nullif((x->>'minuto'), '')::smallint,
    nullif((x->>'live_started_at'), '')::bigint
  from jsonb_array_elements(coalesce(p_partidos, '[]'::jsonb)) as t(x);
end;
$$;

revoke all on function public.sync_partido_resultados(text, jsonb) from public;
grant execute on function public.sync_partido_resultados(text, jsonb) to anon, authenticated;
