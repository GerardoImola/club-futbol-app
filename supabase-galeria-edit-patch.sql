-- Si ya ejecutaste supabase-galeria.sql antes, corré SOLO este archivo para agregar
-- edición: renombrar álbum, eliminar foto, eliminar álbum y borrado en Storage.

-- (Copia del bloque "Edición admin" de supabase-galeria.sql — mismo contenido.)

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

drop policy if exists "galeria_objects_delete" on storage.objects;
create policy "galeria_objects_delete"
  on storage.objects for delete
  to public
  using (
    bucket_id = 'galeria'
    and split_part(name, '/', 1)
      ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  );
