/** Mensaje claro cuando fetch falla (red, proyecto pausado, URL mal, bloqueadores). */
export function mensajeErrorRed(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const red =
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
