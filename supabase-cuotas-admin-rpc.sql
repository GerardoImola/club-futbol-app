-- Cuotas: listar y marcar como pagada desde la app de administración.
-- Usa la misma clave que list_socios_admin (tabla resultados_admin_secret).
-- Ejecutá en Supabase → SQL Editor (requisitos: socios, cuotas, resultados_admin_secret).
--
-- Si la app devuelve PGRST202 "Could not find ... marcar_pendientes_socios_admin":
--   1) Volvé a ejecutar TODO este archivo.
--   2) Supabase → Project Settings → Data API → "Reload schema" (o esperá un minuto).
-- Las funciones masivas usan text[] (ids como texto) para mejor compatibilidad con PostgREST.

create or replace function public.list_cuotas_socio_admin(
  p_admin_password text,
  p_socio_id uuid
)
returns table (
  id uuid,
  mes integer,
  anio integer,
  monto numeric,
  pagada boolean,
  fecha_pago timestamptz
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
  select c.id, c.mes, c.anio, c.monto, c.pagada, c.fecha_pago
  from public.cuotas c
  where c.socio_id = p_socio_id
  order by c.anio desc, c.mes desc;
end;
$$;

create or replace function public.marcar_cuota_pagada_admin(
  p_admin_password text,
  p_cuota_id uuid
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

  update public.cuotas
  set
    pagada = true,
    fecha_pago = now()
  where id = p_cuota_id;

  if not found then
    raise exception 'Cuota no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.list_cuotas_socio_admin(text, uuid) from public;
grant execute on function public.list_cuotas_socio_admin(text, uuid) to anon, authenticated;

revoke all on function public.marcar_cuota_pagada_admin(text, uuid) from public;
grant execute on function public.marcar_cuota_pagada_admin(text, uuid) to anon, authenticated;

-- Evitar sobrecargas uuid[] vs text[] (PostgREST puede no elegir bien).
drop function if exists public.marcar_cuotas_pagadas_admin(text, uuid[]);
drop function if exists public.marcar_pendientes_socios_admin(text, uuid[]);

-- Marca varias cuotas por id (solo pendientes). p_cuota_ids = textos uuid. Devuelve cantidad actualizada.
create or replace function public.marcar_cuotas_pagadas_admin(
  p_admin_password text,
  p_cuota_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
  n integer;
begin
  select s.secret into expected
  from public.resultados_admin_secret s
  where s.id = 1;

  if expected is null or p_admin_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_cuota_ids is null or coalesce(array_length(p_cuota_ids, 1), 0) = 0 then
    return 0;
  end if;

  update public.cuotas
  set
    pagada = true,
    fecha_pago = now()
  where id::text = any(p_cuota_ids)
    and pagada = false;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- Marca TODAS las cuotas pendientes de los socios indicados. p_socio_ids = textos uuid.
create or replace function public.marcar_pendientes_socios_admin(
  p_admin_password text,
  p_socio_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
  n integer;
begin
  select s.secret into expected
  from public.resultados_admin_secret s
  where s.id = 1;

  if expected is null or p_admin_password is distinct from expected then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if p_socio_ids is null or coalesce(array_length(p_socio_ids, 1), 0) = 0 then
    return 0;
  end if;

  update public.cuotas
  set
    pagada = true,
    fecha_pago = now()
  where socio_id::text = any(p_socio_ids)
    and pagada = false;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.marcar_cuotas_pagadas_admin(text, text[]) from public;
grant execute on function public.marcar_cuotas_pagadas_admin(text, text[]) to anon, authenticated;

revoke all on function public.marcar_pendientes_socios_admin(text, text[]) from public;
grant execute on function public.marcar_pendientes_socios_admin(text, text[]) to anon, authenticated;
