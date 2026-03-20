-- Si ya ejecutaste supabase-resultados.sql pero la app falla al leer partido_resultados
-- (401, permission denied o error en red), ejecutá solo esto en SQL Editor:

grant usage on schema public to anon, authenticated;
grant select on table public.partido_resultados to anon, authenticated, service_role;
