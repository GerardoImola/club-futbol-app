-- Parche si al guardar resultados o fixture aparece: "DELETE requires a WHERE clause"
-- (Supabase no acepta DELETE ... WHERE true como WHERE “real”.)
-- Ejecutá TODO este archivo una vez en Supabase → SQL Editor.

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

  delete from public.partido_resultados where legacy_id is not null;

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

create or replace function public.sync_fixture_partidos(
  p_admin_password text,
  p_rows jsonb
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

  delete from public.fixture_partidos where orden is not null;

  insert into public.fixture_partidos (fecha, local, visitante, orden)
  select
    coalesce(x->>'fecha', ''),
    coalesce(x->>'local', ''),
    coalesce(x->>'visitante', ''),
    (x->>'orden')::integer
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as t(x)
  where (x->>'orden') is not null
    and coalesce(x->>'local', '') <> ''
    and coalesce(x->>'visitante', '') <> '';
end;
$$;
