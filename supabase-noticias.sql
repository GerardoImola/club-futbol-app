-- Noticias del club (lectura pública; escritura solo vía RPC con contraseña de admin).
-- Requiere public.resultados_admin_secret (supabase-resultados.sql).
-- Ejecutá en Supabase → SQL Editor.

create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  legacy_id integer not null unique,
  titulo text not null,
  resumen text not null,
  fecha text not null,
  intro text,
  logros jsonb,
  cierre text,
  orden integer not null default 0
);

create index if not exists idx_noticias_orden on public.noticias (orden);

alter table public.noticias enable row level security;

drop policy if exists "Noticias lectura pública" on public.noticias;
create policy "Noticias lectura pública"
  on public.noticias for select
  to anon, authenticated
  using (true);

grant select on table public.noticias to anon, authenticated, service_role;

create or replace function public.sync_noticias_admin(
  p_admin_password text,
  p_noticias jsonb
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

  delete from public.noticias where legacy_id is not null;

  insert into public.noticias (legacy_id, titulo, resumen, fecha, intro, logros, cierre, orden)
  select
    (elem->>'legacy_id')::integer,
    coalesce(elem->>'titulo', ''),
    coalesce(elem->>'resumen', ''),
    coalesce(elem->>'fecha', ''),
    nullif(trim(elem->>'intro'), ''),
    case
      when jsonb_typeof(elem->'logros') = 'array' then elem->'logros'
      else null
    end,
    nullif(trim(elem->>'cierre'), ''),
    (t.idx - 1)::integer
  from jsonb_array_elements(coalesce(p_noticias, '[]'::jsonb)) with ordinality as t(elem, idx);
end;
$$;

revoke all on function public.sync_noticias_admin(text, jsonb) from public;
grant execute on function public.sync_noticias_admin(text, jsonb) to anon, authenticated;
