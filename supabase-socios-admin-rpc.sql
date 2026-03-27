-- Lista de socios para la app (solo con contraseña de admin, misma que resultados_admin_secret).
-- Requisitos: tabla resultados_admin_secret + tabla socios (ver supabase-resultados.sql y setup).
-- Ejecutá en Supabase → SQL Editor.
-- Nota: esta función también está al final de supabase-resultados.sql (podés correr solo ese archivo completo).

create or replace function public.list_socios_admin(p_admin_password text)
returns table (
  id uuid,
  numero_socio integer,
  nombre text,
  email text,
  telefono text,
  created_at timestamptz
)
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

  return query
  select soc.id, soc.numero_socio, soc.nombre, soc.email, soc.telefono, soc.created_at
  from public.socios soc
  order by soc.numero_socio;
end;
$$;

revoke all on function public.list_socios_admin(text) from public;
grant execute on function public.list_socios_admin(text) to anon, authenticated;
