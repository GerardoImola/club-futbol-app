# App Club de Fútbol

Aplicación web para un club de fútbol con las siguientes funcionalidades:

## Funcionalidades

- **Noticias**: Novedades y noticias de los partidos
- **Resultados en vivo**: Seguimiento de partidos en tiempo real (con indicador EN VIVO)
- **Galería de fotos**: Fotos de los momentos del club
- **Plantel**: Primera división e inferiores (Sub-18, Sub-16, Sub-14)
- **Hacerse socio**: Formulario de inscripción con beneficios
- **Mi cuenta**: Área de socios para pagar la cuota mensual

## Tecnologías

- Angular 18
- Standalone components
- Lazy loading de rutas

## Cómo ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:4200`

## Mi Cuenta - Socios

Los socios pueden registrarse e ingresar para ver su número de socio, cuotas pagadas y adeudadas.

### Configuración Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. En **Settings > API**, copiá la URL y la clave `anon` (public)
3. Pegá en `src/environments/environment.ts`:
   ```typescript
   supabaseUrl: 'https://xxx.supabase.co',
   supabaseKey: 'eyJ...'
   ```
4. En Supabase **SQL Editor**, ejecutá **`supabase-setup-completo.sql`** (tablas `socios` / `cuotas`, políticas, trigger, etc.). Si preferís por partes: `supabase-schema.sql` y luego `supabase-registro-trigger.sql`.
5. (Opcional) **`supabase-fixture.sql`**: calendario en `fixture_partidos`; la app lo lee desde la base (si falla o está vacía, usa datos locales).
6. **`supabase-resultados.sql`**: guarda **marcadores y estados** en `partido_resultados` para que se vean igual en PC, Vercel y celular. La clave por defecto en la tabla `resultados_admin_secret` es `cac2025`; debe coincidir con `adminPassword` en `environment.ts` / `environment.prod.ts`. Si cambiás la contraseña del admin, ejecutá: `update public.resultados_admin_secret set secret = 'tu_clave' where id = 1;` El mismo archivo crea la función **`list_socios_admin`** (pantalla **Socios** del admin): devuelve nombre, teléfono y **resumen de cuotas** (`cuotas_pendientes`, `cuotas_total`), sin email en el listado. Los scripts del repo incluyen `DROP FUNCTION IF EXISTS ... list_socios_admin(text)` antes del `CREATE`, porque PostgreSQL no permite cambiar las columnas devueltas solo con `CREATE OR REPLACE` (error **42P13**). Si ves el error `Could not find the function public.list_socios_admin`, volvé a ejecutar **`supabase-resultados.sql`** completo en el SQL Editor (o **`supabase-socios-admin-rpc.sql`**). Después, **Reload schema** en Data API si hace falta.
6b. **`supabase-cuotas-admin-rpc.sql`** (después del paso 6): crea **`list_cuotas_socio_admin`**, **`marcar_cuota_pagada_admin`** (una cuota), **`marcar_cuotas_pagadas_admin`** y **`marcar_pendientes_socios_admin`** (estas dos últimas reciben arrays de ids como `text[]` para PostgREST). En **Admin → Socios** podés seleccionar socios y **Marcar pendientes como pagadas**, o en **Gestionar** marcar cuotas puntuales o varias con checkboxes. Si el navegador muestra **PGRST202** (`Could not find the function ... marcar_pendientes_socios_admin`), ejecutá de nuevo **todo** ese archivo en el SQL Editor y en **Project Settings → Data API** usá **Reload schema** (a veces tarda unos segundos en actualizar el caché).
7. **`supabase-noticias.sql`**: tabla `noticias` (lectura pública) y RPC **`sync_noticias_admin`** para que el admin publique novedades desde la pantalla **Noticias**. Requiere el paso 6 (`resultados_admin_secret`).
8. Si en el navegador falla la petición a `partido_resultados` (401 o permisos), ejecutá también **`supabase-resultados-grants.sql`** o volvé a correr `supabase-resultados.sql` completo (incluye `GRANT SELECT`). En **Supabase → Project Settings → Data API**, comprobá que las tablas del esquema `public` estén expuestas (por defecto sí).
9. **`supabase-fixture-rpc.sql`** (después del paso 6): crea la función `sync_fixture_partidos` para **publicar el calendario desde la app** (botón en Fixture, sesión admin). Usa la misma clave que `resultados_admin_secret`. Si volvés a ejecutar **`supabase-fixture.sql`**, al final ya incluye `GRANT SELECT` sobre `fixture_partidos`.

**Posiciones:** la tabla de posiciones **no se guarda en la base**: se calcula en el navegador con el fixture + los resultados. Con fixture y resultados sincronizados en Supabase, todos ven la misma tabla.

**Error `DELETE requires a WHERE clause` al guardar:** Supabase no acepta `DELETE ... WHERE true`. Ejecutá **`supabase-rpc-delete-where-fix.sql`** en el SQL Editor o volvé a aplicar **`supabase-resultados.sql`** / **`supabase-fixture-rpc.sql`** / **`supabase-noticias.sql`** (usan `WHERE legacy_id IS NOT NULL` o `WHERE orden IS NOT NULL` según la tabla).

### Si al registrarte ves "Failed to fetch"

- Reactivá el proyecto en [Supabase Dashboard](https://supabase.com/dashboard) (los free se **pausan** si no los usás un tiempo).
- Confirmá que **Settings → API → Project URL** sea **exactamente** la misma que `supabaseUrl` en `environment.ts` (sin espacios, con `https://`). Ojo: el subdominio tiene letras parecidas (`khrs` vs `khsr`); si está mal **no resuelve DNS** y el navegador muestra `Failed to fetch`.
- **Authentication → URL configuration**: agregá `http://localhost:4200` en **Site URL** y en **Redirect URLs** (`http://localhost:4200/**`).
- **Recuperar contraseña:** en **Redirect URLs** tiene que estar la ruta exacta **`…/socios/login`** (ej. `https://tu-app.vercel.app/socios/login` y `http://localhost:4200/socios/login`). El enlace del email te lleva ahí para elegir contraseña nueva.
- Si abrís la app desde **`http://192.168.x.x:4200`** (otro dispositivo en la red), agregá también esa URL en Redirect URLs, o usá solo `http://127.0.0.1:4200` en la misma PC.
- Probá sin VPN / sin bloqueador de anuncios y en otro navegador.

### Flujo

- **Registrarse**: Hacerse Socio → "Accedé a tu cuenta" → "Registrate" → nombre, email, contraseña
- **Ingresar**: Mismo link → email y contraseña. **¿Olvidaste tu contraseña?** pedí el enlace por email desde la misma pantalla de ingreso.
- Al registrarse se asigna un **número de socio** automático
- Se crea la cuota del mes actual como adeudada (**monto por defecto $10.000**; configurable en `socio-auth.service.ts` y en los `.sql` de Supabase)
- Si ya tenías cuotas cargadas a $5.000, ejecutá **`supabase-cuota-monto-10000.sql`** y volvé a aplicar el trigger desde `supabase-registro-trigger.sql`
- El admin marca cuotas como pagadas desde la app (**Admin → Socios → Gestionar**), si ejecutaste **`supabase-cuotas-admin-rpc.sql`**

## Admin - Editar resultados

Solo vos podés modificar los resultados. Los demás usuarios solo ven la información.

1. En la página de Resultados, tocá **"Soy admin"**
2. Ingresá tu contraseña (por defecto: `cac2025`)
3. Cambiá la contraseña en `src/environments/environment.ts` y `environment.prod.ts` antes de publicar, y actualizá **`resultados_admin_secret`** en Supabase (ver paso 6 arriba).

Cuando guardás un resultado (Resultados o **Guardar final** en Fixture), la app **sincroniza la lista completa** con Supabase si estás logueado como admin. En **Fixture**, el botón **Publicar calendario en Supabase** sube el calendario que ves en pantalla (necesitás haber ejecutado `supabase-fixture-rpc.sql`). La sesión admin dura mientras la pestaña esté abierta (`sessionStorage`).

## Personalización

Para cambiar el nombre del club, editar la variable `clubName` en `src/app/app.component.ts`:

```typescript
clubName = 'Nombre de tu club';
```

## Próximos pasos

- API o Supabase para **plantel** si querés editarlo desde la app (las noticias ya pueden publicarse con `supabase-noticias.sql`)
- Integrar pasarela de pagos (Mercado Pago, Stripe, etc.) en Mi Cuenta
- Subir fotos reales a la galería
- Sistema de login para socios
