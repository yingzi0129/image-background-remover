const encoder = new TextEncoder();

type SessionPayload = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const norm = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = norm + '='.repeat((4 - (norm.length % 4 || 4)) % 4);
  const bin = atob(padded);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload: SessionPayload, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const body = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify('HMAC', key, fromBase64Url(sig), encoder.encode(`${header}.${payload}`));
  if (!ok) return null;
  const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionPayload;
  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}
