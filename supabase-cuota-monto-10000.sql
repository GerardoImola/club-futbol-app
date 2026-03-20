-- Opcional: si la base ya existía con cuota $5000, ejecutá en SQL Editor para pasar a $10000.

alter table public.cuotas alter column monto set default 10000;

update public.cuotas
set monto = 10000
where not pagada;

-- Recreá el trigger con el nuevo monto (copiá la función desde supabase-registro-trigger.sql)
-- o ejecutá solo el bloque create or replace function + trigger de ese archivo.
