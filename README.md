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
6. **`supabase-resultados.sql`**: guarda **marcadores y estados** en `partido_resultados` para que se vean igual en PC, Vercel y celular. La clave por defecto en la tabla `resultados_admin_secret` es `cac2025`; debe coincidir con `adminPassword` en `environment.ts` / `environment.prod.ts`. Si cambiás la contraseña del admin, ejecutá: `update public.resultados_admin_secret set secret = 'tu_clave' where id = 1;`
7. Si en el navegador falla la petición a `partido_resultados` (401 o permisos), ejecutá también **`supabase-resultados-grants.sql`** o volvé a correr `supabase-resultados.sql` completo (incluye `GRANT SELECT`). En **Supabase → Project Settings → Data API**, comprobá que las tablas del esquema `public` estén expuestas (por defecto sí).
8. **`supabase-fixture-rpc.sql`** (después del paso 6): crea la función `sync_fixture_partidos` para **publicar el calendario desde la app** (botón en Fixture, sesión admin). Usa la misma clave que `resultados_admin_secret`. Si volvés a ejecutar **`supabase-fixture.sql`**, al final ya incluye `GRANT SELECT` sobre `fixture_partidos`.

**Posiciones:** la tabla de posiciones **no se guarda en la base**: se calcula en el navegador con el fixture + los resultados. Con fixture y resultados sincronizados en Supabase, todos ven la misma tabla.

**Error `DELETE requires a WHERE clause` al guardar:** ejecutá **`supabase-rpc-delete-where-fix.sql`** en el SQL Editor (actualiza las funciones RPC). Los archivos `supabase-resultados.sql` y `supabase-fixture-rpc.sql` en el repo ya traen el arreglo (`DELETE ... WHERE true`).

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
- El admin puede marcar cuotas como pagadas desde Supabase (o agregar integración de pagos)

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

- Backend/API para noticias y plantel (los resultados ya usan Supabase si ejecutaste `supabase-resultados.sql`)
- Integrar pasarela de pagos (Mercado Pago, Stripe, etc.) en Mi Cuenta
- Subir fotos reales a la galería
- Sistema de login para socios
