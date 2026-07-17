const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]);

export function isValidGoogleMapsUrl(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port || !GOOGLE_MAPS_HOSTS.has(url.hostname.toLowerCase())) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;
  if (hostname === 'google.com' || hostname === 'www.google.com') {
    return pathname === '/maps' || pathname.startsWith('/maps/');
  }
  if (hostname === 'goo.gl') {
    return pathname === '/maps' || pathname.startsWith('/maps/');
  }
  if (hostname === 'maps.app.goo.gl') return pathname.length > 1;

  return pathname.length > 1 || Boolean(url.search);
}

/** Returns the exact trimmed Admin input only when it is safe to open. */
export function getSafeGoogleMapsUrl(value: string): string | undefined {
  const candidate = value.trim();
  return isValidGoogleMapsUrl(candidate) ? candidate : undefined;
}
