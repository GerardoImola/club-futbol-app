/**
 * Texto legible desde Error, PostgrestError, StorageApiError u objetos { message }.
 * Evita mostrar "[object Object]" en la UI.
 */
export function extractErrorText(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err.trim();
  if (err instanceof Error) {
    const m = err.message?.trim();
    if (m && m !== '[object Object]') return m;
  }
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o['message'] === 'string' && o['message'].trim()) return o['message'].trim();
    if (typeof o['error'] === 'object' && o['error'] != null) return extractErrorText(o['error']);
    if (typeof o['details'] === 'string' && o['details'].trim()) return o['details'].trim();
    if (typeof o['hint'] === 'string' && o['hint'].trim()) return o['hint'].trim();
    try {
      const s = JSON.stringify(o);
      if (s.length > 2 && s !== '{}') return s;
    } catch {
      /* ignore */
    }
  }
  return '';
}

/** Errores de API Supabase (tablas, RPC, Storage) con mensaje claro y ayuda si falta el SQL. */
export function mensajeErrorSupabase(err: unknown): string {
  const msg = extractErrorText(err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  const status =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? (err as { statusCode: unknown }).statusCode
      : typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status: unknown }).status
        : undefined;

  const red =
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    err instanceof TypeError;

  if (red || !msg) {
    return mensajeErrorRed(err instanceof Error ? err : msg ? new Error(msg) : err);
  }

  const lower = msg.toLowerCase();
  const faltaEnProyecto =
    status === 404 ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === 'PGRST116' ||
    lower.includes('could not find') ||
    lower.includes('schema cache') ||
    lower.includes('does not exist') ||
    lower.includes('404');

  if (faltaEnProyecto) {
    const esGaleria =
      lower.includes('galeria') ||
      lower.includes('rpc_galeria') ||
      lower.includes('bucket not found') ||
      lower.includes('not found') && lower.includes('storage');
    if (esGaleria || lower.includes('function') || code === 'PGRST202') {
      return (
        'La galería aún no está creada en tu proyecto Supabase (o el nombre no coincide). ' +
        'En el dashboard: SQL Editor → pegá y ejecutá el archivo supabase-galeria.sql del repositorio. ' +
        'Eso crea las tablas, las funciones rpc_galeria_* y el bucket "galeria". ' +
        `Detalle técnico: ${msg}`
      );
    }
  }

  return msg;
}

/** Mensaje claro cuando fetch falla (red, proyecto pausado, URL mal, bloqueadores). */
export function mensajeErrorRed(err: unknown): string {
  const msg = extractErrorText(err) || (err != null && typeof err !== 'object' ? String(err) : '');
  const red =
    !msg ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    err instanceof TypeError;

  if (red) {
    return (
      'No se pudo conectar con Supabase. Revisá: ' +
      '(1) Internet. ' +
      '(2) En supabase.com que el proyecto no esté pausado (reactivalo desde el dashboard). ' +
      '(3) Que la URL en environment.ts sea exactamente la de Settings → API (Project URL). ' +
      '(4) Desactivá bloqueadores de anuncios o VPN. ' +
      '(5) Probá otro navegador o `ng serve --host 127.0.0.1`.'
    );
  }
  return msg;
}

/** Mensajes en inglés que devuelve GoTrue / Supabase Auth → español para la UI. */
const MSJ_AUTH_POR_TEXTO: Record<string, string> = {
  'invalid login credentials': 'Email o contraseña incorrectos.',
  'invalid email or password': 'Email o contraseña incorrectos.',
  'email not confirmed':
    'Tenés que confirmar el correo antes de ingresar (revisá tu bandeja de entrada o spam).',
  'user already registered': 'Ese email ya está registrado. Probá ingresar o recuperar la contraseña.',
  'user already registered.': 'Ese email ya está registrado. Probá ingresar o recuperar la contraseña.',
  'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'signup is disabled': 'El registro está deshabilitado en el servidor.',
  'signups not allowed for this instance': 'El registro está deshabilitado en el servidor.',
  'email rate limit exceeded': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'for security purposes, you can only request this after': 'Por seguridad, esperá un momento antes de volver a pedir el enlace.',
  'token has expired or is invalid': 'El enlace expiró o no es válido. Pedí uno nuevo.',
  'new password should be different from the old password': 'La contraseña nueva tiene que ser distinta de la anterior.',
  'unable to validate email address: invalid format': 'El email no tiene un formato válido.',
  'signup requires a valid password': 'La contraseña no es válida para el registro.',
  'invalid grant: user credentials are invalid': 'Email o contraseña incorrectos.',
  'invalid refresh token': 'La sesión expiró. Volvé a ingresar.',
  'jwt expired': 'La sesión expiró. Volvé a ingresar.'
};

/** Por código de error de Auth cuando existe (más estable que el texto en inglés). */
const MSJ_AUTH_POR_CODIGO: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_not_confirmed:
    'Tenés que confirmar el correo antes de ingresar (revisá tu bandeja de entrada o spam).',
  user_not_found: 'No encontramos una cuenta con ese email.',
  user_already_exists: 'Ese email ya está registrado.',
  signup_disabled: 'El registro está deshabilitado en el servidor.',
  weak_password: 'La contraseña es demasiado débil. Usá más caracteres o combiná letras y números.',
  same_password: 'La contraseña nueva tiene que ser distinta de la anterior.',
  otp_expired: 'El código expiró. Pedí uno nuevo.',
  over_email_send_rate_limit: 'Demasiados correos enviados. Esperá unos minutos.',
  over_request_rate_limit: 'Demasiados intentos. Esperá un momento e intentá de nuevo.'
};

/**
 * Traduce mensajes de `auth.*` de Supabase a español. Si ya viene en español u otro texto
 * desconocido, lo devuelve igual.
 */
export function traducirErrorAuthSupabase(error: { message: string; code?: string }): string {
  const code = (error.code || '').toLowerCase().trim();
  if (code && MSJ_AUTH_POR_CODIGO[code]) {
    return MSJ_AUTH_POR_CODIGO[code];
  }
  const msg = (error.message || '').trim();
  if (!msg) return 'Ocurrió un error. Intentá de nuevo.';
  const key = msg.toLowerCase().trim();
  if (MSJ_AUTH_POR_TEXTO[key]) {
    return MSJ_AUTH_POR_TEXTO[key];
  }
  const lower = key;
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (lower.includes('email not confirmed')) {
    return MSJ_AUTH_POR_TEXTO['email not confirmed'];
  }
  if (lower.includes('password') && lower.includes('at least') && lower.includes('6')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (lower.includes('already been registered') || lower.includes('user already registered')) {
    return MSJ_AUTH_POR_TEXTO['user already registered'];
  }
  if (lower.includes('rate limit')) {
    return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.';
  }
  if (lower.includes('invalid email')) {
    return 'El email no tiene un formato válido.';
  }
  return msg;
}
