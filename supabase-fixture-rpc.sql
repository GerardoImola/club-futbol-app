-- Sincronizar fixture desde la app (admin). Requiere resultados_admin_secret (supabase-resultados.sql).
-- Ejecutá en SQL Editor si ya tenés fixture_partidos pero sin esta función.

grant select on table public.fixture_partidos to anon, authenticated, service_role;

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

  delete from public.fixture_partidos;

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

revoke all on function public.sync_fixture_partidos(text, jsonb) from public;
grant execute on function public.sync_fixture_partidos(text, jsonb) to anon, authenticated;
