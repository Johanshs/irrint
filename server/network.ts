import { isIP } from 'node:net';

export type NetworkAccess = 'loopback' | 'lan' | 'public';

function hostname(value: string) {
  try {
    return new URL(`http://${value}`).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return '';
  }
}

function isLoopback(value: string) {
  return value === 'localhost' || value === '::1' || value.startsWith('127.');
}

function isPrivateAddress(value: string) {
  if (isLoopback(value)) return true;
  if (isIP(value) === 4) {
    const [first, second] = value.split('.').map(Number);
    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254)
    );
  }
  if (isIP(value) === 6) return value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd');
  return false;
}

export function isAllowedRequestHost(host: string, access: NetworkAccess) {
  const value = hostname(host);
  return access === 'public'
    ? value.length > 0
    : isLoopback(value) || (access === 'lan' && isPrivateAddress(value));
}

export function isAllowedOrigin(
  origin: string,
  access: NetworkAccess,
  allowedOrigins: readonly string[] = [],
) {
  if (access === 'public') {
    const normalized = origin.replace(/\/$/, '');
    return allowedOrigins.some((allowed) => allowed.replace(/\/$/, '') === normalized);
  }
  try {
    const url = new URL(origin);
    if ((url.protocol === 'capacitor:' || url.protocol === 'ionic:') && url.hostname === 'localhost')
      return access === 'lan';
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const allowedPort = url.port === '' || url.port === '5173' || url.port === '4173';
    if (!allowedPort) return false;
    return isLoopback(url.hostname) || (access === 'lan' && isPrivateAddress(url.hostname));
  } catch {
    return false;
  }
}
