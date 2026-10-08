import { randomBytes } from 'node:crypto';

export function securityConfig(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production';
  let secret = env.SESSION_SECRET || '';
  if (secret.length < 32) {
    if (production) throw new Error('SESSION_SECRET phải được cấu hình với ít nhất 32 ký tự ngẫu nhiên.');
    secret = randomBytes(32).toString('hex');
  }
  const origins = (env.ADMIN_ALLOWED_ORIGINS || 'https://miniapp.tumorong.com')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!production) origins.push('http://localhost:8080', 'http://127.0.0.1:8080');
  for (const origin of origins) {
    const url = new URL(origin);
    if (url.origin !== origin || url.hostname.includes('*') || !['https:', 'http:'].includes(url.protocol) || (production && url.protocol !== 'https:')) {
      throw new Error('ADMIN_ALLOWED_ORIGINS chỉ nhận origin HTTPS cụ thể, không đường dẫn hoặc wildcard.');
    }
  }
  const proxyHops = Number(env.TRUST_PROXY_HOPS || '0');
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 2) {
    throw new Error('TRUST_PROXY_HOPS phải là số nguyên từ 0 đến 2 theo proxy thực tế.');
  }
  return { production, secret, origins: new Set(origins), proxyHops,
    cookieName: production ? '__Host-tumorong.sid' : 'tumorong.sid',
    idleMs: 30 * 60 * 1000, absoluteMs: 12 * 60 * 60 * 1000 };
}

export type SecurityConfig = ReturnType<typeof securityConfig>;
