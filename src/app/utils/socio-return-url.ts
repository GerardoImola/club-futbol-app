/** Evita open redirect: solo rutas internas relativas al origen. */
export function socioSafeReturnUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return null;
  if (t.includes('://')) return null;
  return t;
}
