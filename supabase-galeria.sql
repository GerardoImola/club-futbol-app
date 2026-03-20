-- =============================================================================
-- Galería dinámica: álbumes + fotos en Storage (admin sube desde la app / celular)
-- Supabase → SQL Editor → ejecutar todo.
--
-- IMPORTANTE: la fila admin_password debe ser la MISMA que adminPassword en
-- environment.ts (Angular). Si cambiás la clave en la app, actualizá acá:
--   update public.galeria_settings set value = 'nueva_clave' where key = 'admin_password';
-- =============================================================================

create table if not exists public.galeria_settings (
  key text primary key,
  value text not null
);

alter table public.galeria_settings enable row level security;

insert into public.galeria_settings (key, value)
values ('admin_password', 'cac2025')
on conflict (key) do update set value = excluded.value;

create table if not exists public.galeria_albums (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.galeria_fotos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.galeria_albums (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  unique (album_id, storage_path)
);

create index if not exists idx_galeria_fotos_album on public.galeria_fotos (album_id);

alter table public.galeria_albums enable row level security;
alter table public.galeria_fotos enable row level security;

drop policy if exists "galeria_albums_select_public" on public.galeria_albums;
create policy "galeria_albums_select_public" on public.galeria_albums for select using (true);

drop policy if exists "galeria_fotos_select_public" on public.galeria_fotos;
create policy "galeria_fotos_select_public" on public.galeria_fotos for select using (true);

create or replace function public.galeria_admin_password_ok(p_password text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.galeria_settings s
    where s.key = 'admin_password'
      and s.value is not null
      and s.value = p_password
  );
$$;

create or replace function public.rpc_galeria_crear_album(p_password text, p_titulo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_next integer;
begin
  if not public.galeria_admin_password_ok(p_password) then
    raise exception 'no autorizado';
  end if;
  if trim(p_titulo) = '' then
    raise exception 'título vacío';
  end if;
  select coalesce(max(sort_order), 0) + 1 into v_next from public.galeria_albums;
  insert into public.galeria_albums (titulo, sort_order)
  values (trim(p_titulo), v_next)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.rpc_galeria_registrar_foto(
  p_password text,
  p_album_id uuid,
  p_storage_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
  v_prefix text;
begin
  if not public.galeria_admin_password_ok(p_password) then
    raise exception 'no autorizado';
  end if;
  if not exists (select 1 from public.galeria_albums where id = p_album_id) then
    raise exception 'álbum inexistente';
  end if;
  v_prefix := p_album_id::text;
  if p_storage_path is null
     or position('/' in p_storage_path) = 0
     or split_part(p_storage_path, '/', 1) is distinct from v_prefix
  then
    raise exception 'ruta inválida';
  end if;
  select coalesce(max(sort_order), 0) + 1 into v_next
  from public.galeria_fotos where album_id = p_album_id;
  insert into public.galeria_fotos (album_id, storage_path, sort_order)
  values (p_album_id, p_storage_path, v_next)
  on conflict (album_id, storage_path) do nothing;
end;
$$;

grant execute on function public.rpc_galeria_crear_album(text, text) to anon, authenticated;
grant execute on function public.rpc_galeria_registrar_foto(text, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Edición admin: renombrar álbum, borrar foto, borrar álbum completo
-- ---------------------------------------------------------------------------

create or replace function public.rpc_galeria_renombrar_album(
  p_password text,
  p_album_id uuid,
  p_titulo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.galeria_admin_password_ok(p_password) then
    raise exception 'no autorizado';
  end if;
  if trim(p_titulo) = '' then
    raise exception 'título vacío';
  end if;
  update public.galeria_albums
  set titulo = trim(p_titulo)
  where id = p_album_id;
  if not found then
    raise exception 'álbum inexistente';
  end if;
end;
$$;

create or replace function public.rpc_galeria_eliminar_foto(p_password text, p_foto_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if not public.galeria_admin_password_ok(p_password) then
    raise exception 'no autorizado';
  end if;
  delete from public.galeria_fotos where id = p_foto_id returning storage_path into v_path;
  if v_path is null then
    raise exception 'foto inexistente';
  end if;
  return v_path;
end;
$$;

create or replace function public.rpc_galeria_eliminar_album(p_password text, p_album_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paths text[];
begin
  if not public.galeria_admin_password_ok(p_password) then
    raise exception 'no autorizado';
  end if;
  select coalesce(array_agg(f.storage_path), array[]::text[]) into v_paths
  from public.galeria_fotos f
  where f.album_id = p_album_id;
  delete from public.galeria_albums where id = p_album_id;
  if not found then
    raise exception 'álbum inexistente';
  end if;
  return v_paths;
end;
$$;

grant execute on function public.rpc_galeria_renombrar_album(text, uuid, text) to anon, authenticated;
grant execute on function public.rpc_galeria_eliminar_foto(text, uuid) to anon, authenticated;
grant execute on function public.rpc_galeria_eliminar_album(text, uuid) to anon, authenticated;

-- Borrar archivos del bucket (la app llama a Storage.remove después del RPC).
-- Solo rutas cuya primera carpeta sea un UUID (carpeta = id del álbum).
drop policy if exists "galeria_objects_delete" on storage.objects;
create policy "galeria_objects_delete"
  on storage.objects for delete
  to public
  using (
    bucket_id = 'galeria'
    and split_part(name, '/', 1)
      ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  );

insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "galeria_objects_select" on storage.objects;
create policy "galeria_objects_select"
  on storage.objects for select
  using (bucket_id = 'galeria');

drop policy if exists "galeria_objects_insert_album" on storage.objects;
create policy "galeria_objects_insert_album"
  on storage.objects for insert
  with check (
    bucket_id = 'galeria'
    and exists (
      select 1 from public.galeria_albums a
      where a.id::text = split_part(name, '/', 1)
    )
  );
