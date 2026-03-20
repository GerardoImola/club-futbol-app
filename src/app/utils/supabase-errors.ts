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
