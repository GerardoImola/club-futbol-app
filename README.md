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
4. En Supabase **SQL Editor**, ejecutá **`supabase-setup-completo.sql`**
5. (Opcional) **`supabase-fixture.sql`**: guarda el calendario en la tabla `fixture_partidos`; la página Fixture lo lee desde la base (si falla o está vacía, usa el archivo local). (crea tablas `socios` y `cuotas`, políticas, trigger y completa datos de usuarios ya registrados).  
   Si preferís por partes: `supabase-schema.sql` y luego `supabase-registro-trigger.sql`.

### Si al registrarte ves "Failed to fetch"

- Reactivá el proyecto en [Supabase Dashboard](https://supabase.com/dashboard) (los free se **pausan** si no los usás un tiempo).
- Confirmá que **Settings → API → Project URL** sea **exactamente** la misma que `supabaseUrl` en `environment.ts` (sin espacios, con `https://`). Ojo: el subdominio tiene letras parecidas (`khrs` vs `khsr`); si está mal **no resuelve DNS** y el navegador muestra `Failed to fetch`.
- **Authentication → URL configuration**: agregá `http://localhost:4200` en **Site URL** y en **Redirect URLs** (`http://localhost:4200/**`).
- Si abrís la app desde **`http://192.168.x.x:4200`** (otro dispositivo en la red), agregá también esa URL en Redirect URLs, o usá solo `http://127.0.0.1:4200` en la misma PC.
- Probá sin VPN / sin bloqueador de anuncios y en otro navegador.

### Flujo

- **Registrarse**: Hacerse Socio → "Accedé a tu cuenta" → "Registrate" → nombre, email, contraseña
- **Ingresar**: Mismo link → email y contraseña
- Al registrarse se asigna un **número de socio** automático
- Se crea la cuota del mes actual como adeudada
- El admin puede marcar cuotas como pagadas desde Supabase (o agregar integración de pagos)

## Admin - Editar resultados

Solo vos podés modificar los resultados. Los demás usuarios solo ven la información.

1. En la página de Resultados, tocá **"Soy admin"**
2. Ingresá tu contraseña (por defecto: `cac2025`)
3. Cambiá la contraseña en `src/environments/environment.ts` y `environment.prod.ts` antes de publicar

La sesión se mantiene mientras tengas la pestaña abierta. Al cerrar el navegador, tenés que volver a ingresar.

## Personalización

Para cambiar el nombre del club, editar la variable `clubName` en `src/app/app.component.ts`:

```typescript
clubName = 'Nombre de tu club';
```

## Próximos pasos

- Conectar con backend/API para noticias, resultados y plantel
- Integrar pasarela de pagos (Mercado Pago, Stripe, etc.) en Mi Cuenta
- Subir fotos reales a la galería
- Sistema de login para socios
