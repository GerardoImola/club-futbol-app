-- Ejecutá esto en Supabase → SQL Editor (una sola vez).
-- Al registrarse un usuario, se crea su fila en "socios" (con número de socio) y la cuota del mes.

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
