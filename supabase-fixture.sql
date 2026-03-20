-- Fixture Primera División — ejecutar en SQL Editor (una vez)
-- Lectura pública: la app usa la clave anon.

create table if not exists public.fixture_partidos (
  id uuid primary key default gen_random_uuid(),
  fecha text not null,
  local text not null,
  visitante text not null,
  orden integer not null unique
);

create index if not exists idx_fixture_fecha on public.fixture_partidos (fecha);

alter table public.fixture_partidos enable row level security;

drop policy if exists "Fixture lectura pública" on public.fixture_partidos;
create policy "Fixture lectura pública"
  on public.fixture_partidos
  for select
  to anon, authenticated
  using (true);

-- Datos iniciales (48 partidos). Para reemplazar todo: TRUNCATE public.fixture_partidos; y volver a ejecutar desde aquí.
insert into public.fixture_partidos (fecha, local, visitante, orden) values
('Dom 15/03', 'Pabellón Arg.', 'Los Andes', 1),
('Dom 15/03', 'Jorge Ross', 'Libertad', 2),
('Dom 15/03', 'Belgrano Jrs.', 'A. Sarmiento', 3),
('Dom 15/03', 'Sp. La Cesira', 'Arias Football', 4),
('Dom 15/03', 'Club Atlético Canalense', 'Central Arg.', 5),
('Dom 15/03', 'B. Sarmiento', 'Colonia', 6),
('Dom 22/03', 'Libertad', 'Los Andes', 7),
('Dom 22/03', 'A. Sarmiento', 'Pabellón Arg.', 8),
('Dom 22/03', 'Arias Football', 'Jorge Ross', 9),
('Dom 22/03', 'Central Arg.', 'Belgrano Jrs.', 10),
('Dom 22/03', 'B. Sarmiento', 'Sp. La Cesira', 11),
('Dom 22/03', 'Colonia', 'Club Atlético Canalense', 12),
('Dom 29/03', 'Los Andes', 'Colonia', 13),
('Dom 29/03', 'Club Atlético Canalense', 'B. Sarmiento', 14),
('Dom 29/03', 'Sp. La Cesira', 'Central Arg.', 15),
('Dom 29/03', 'Belgrano Jrs.', 'Arias Football', 16),
('Dom 29/03', 'Jorge Ross', 'A. Sarmiento', 17),
('Dom 29/03', 'Pabellón Arg.', 'Libertad', 18),
('Dom 05/04', 'Los Andes', 'Club Atlético Canalense', 19),
('Dom 05/04', 'Sp. La Cesira', 'Colonia', 20),
('Dom 05/04', 'Belgrano Jrs.', 'B. Sarmiento', 21),
('Dom 05/04', 'Jorge Ross', 'Central Arg.', 22),
('Dom 05/04', 'Pabellón Arg.', 'Arias Football', 23),
('Dom 05/04', 'Libertad', 'A. Sarmiento', 24),
('Dom 12/04', 'A. Sarmiento', 'Los Andes', 25),
('Dom 12/04', 'Arias Football', 'Libertad', 26),
('Dom 12/04', 'Central Arg.', 'Pabellón Arg.', 27),
('Dom 12/04', 'B. Sarmiento', 'Jorge Ross', 28),
('Dom 12/04', 'Colonia', 'Belgrano Jrs.', 29),
('Dom 12/04', 'Club Atlético Canalense', 'Sp. La Cesira', 30),
('Dom 19/04', 'Central Arg.', 'Jorge Ross', 31),
('Dom 19/04', 'Arias Football', 'Belgrano Jrs.', 32),
('Dom 19/04', 'Libertad', 'Club Atlético Canalense', 33),
('Dom 19/04', 'Pabellón Arg.', 'Colonia', 34),
('Dom 19/04', 'Sp. La Cesira', 'A. Sarmiento', 35),
('Dom 19/04', 'Los Andes', 'B. Sarmiento', 36),
('Dom 26/04', 'Los Andes', 'Sp. La Cesira', 37),
('Dom 26/04', 'Belgrano Jrs.', 'Club Atlético Canalense', 38),
('Dom 26/04', 'Jorge Ross', 'Colonia', 39),
('Dom 26/04', 'Pabellón Arg.', 'B. Sarmiento', 40),
('Dom 26/04', 'Libertad', 'Central Arg.', 41),
('Dom 26/04', 'A. Sarmiento', 'Arias Football', 42),
('Dom 03/05', 'Arias Football', 'Los Andes', 43),
('Dom 03/05', 'Central Arg.', 'A. Sarmiento', 44),
('Dom 03/05', 'B. Sarmiento', 'Libertad', 45),
('Dom 03/05', 'Colonia', 'Pabellón Arg.', 46),
('Dom 03/05', 'Club Atlético Canalense', 'Jorge Ross', 47),
('Dom 03/05', 'Sp. La Cesira', 'Belgrano Jrs.', 48)
on conflict (orden) do update set
  fecha = excluded.fecha,
  local = excluded.local,
  visitante = excluded.visitante;

-- Permisos de lectura para la API (evita errores con RLS)
grant select on table public.fixture_partidos to anon, authenticated, service_role;

-- Para publicar el calendario desde la app (admin): ejecutá supabase-fixture-rpc.sql
-- después de supabase-resultados.sql (usa resultados_admin_secret).
