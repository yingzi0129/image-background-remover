import { exchangeCodeForTokens, fetchGoogleUserInfo } from './google';
import { signSession, verifySession } from './session';

export interface Env {
  REMOVEBG_API_KEY?: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  USERS_DB: D1Database;
  APP_ORIGIN?: string;
}

const COOKIE_NAME = 'ibr_session';

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function getOrigin(req: Request, env: Env) {
  return env.APP_ORIGIN || new URL(req.url).origin;
}

function getCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') || '';
  const parts = raw.split(/;\s*/);
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    const v = part.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

function sessionCookie(value: string, maxAge = 60 * 60 * 24 * 30) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function upsertUser(env: Env, user: Awaited<ReturnType<typeof fetchGoogleUserInfo>>) {
  await env.USERS_DB.prepare(
    `INSERT INTO users (google_sub, email, email_verified, name, given_name, family_name, avatar_url, locale, last_login_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(google_sub) DO UPDATE SET
       email=excluded.email,
       email_verified=excluded.email_verified,
       name=excluded.name,
       given_name=excluded.given_name,
       family_name=excluded.family_name,
       avatar_url=excluded.avatar_url,
       locale=excluded.locale,
       last_login_at=CURRENT_TIMESTAMP,
       updated_at=CURRENT_TIMESTAMP`
  )
    .bind(
      user.sub,
      user.email || null,
      user.email_verified ? 1 : 0,
      user.name || null,
      user.given_name || null,
      user.family_name || null,
      user.picture || null,
      user.locale || null
    )
    .run();

  return env.USERS_DB.prepare(
    `SELECT id, google_sub, email, email_verified, name, given_name, family_name, avatar_url, locale, created_at, updated_at, last_login_at
     FROM users WHERE google_sub = ?1`
  )
    .bind(user.sub)
    .first();
}

async function handleGoogleLogin(req: Request, env: Env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
    return json({
      error: 'Missing Google auth configuration',
      hasClientId: Boolean(env.GOOGLE_CLIENT_ID),
      hasClientSecret: Boolean(env.GOOGLE_CLIENT_SECRET),
      hasSessionSecret: Boolean(env.SESSION_SECRET),
    }, { status: 500 });
  }

  const origin = getOrigin(req, env);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);
  return Response.redirect(authUrl.toString(), 302);
}

async function handleGoogleCallback(req: Request, env: Env) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const origin = getOrigin(req, env);
  if (error) {
    return Response.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`, 302);
  }
  if (!code) {
    return Response.redirect(`${origin}/?auth_error=missing_code`, 302);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokens = await exchangeCodeForTokens({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    code,
    redirectUri,
  });
  const googleUser = await fetchGoogleUserInfo(tokens.access_token);
  const user = await upsertUser(env, googleUser);
  const session = await signSession(
    {
      uid: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    },
    env.SESSION_SECRET
  );

  const resp = Response.redirect(`${origin}/`, 302);
  resp.headers.append('Set-Cookie', sessionCookie(session));
  return resp;
}

async function requireUser(req: Request, env: Env) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return null;
  const session = await verifySession(token, env.SESSION_SECRET);
  if (!session) return null;
  const user = await env.USERS_DB.prepare(
    `SELECT id, google_sub, email, email_verified, name, given_name, family_name, avatar_url, locale, created_at, updated_at, last_login_at
     FROM users WHERE google_sub = ?1`
  )
    .bind(session.uid)
    .first();
  return user || null;
}

async function handleMe(req: Request, env: Env) {
  const user = await requireUser(req, env);
  if (!user) return json({ authenticated: false }, { status: 401 });
  return json({ authenticated: true, user });
}

async function handleLogout(req: Request, env: Env) {
  const origin = getOrigin(req, env);
  const resp = Response.redirect(`${origin}/`, 302);
  resp.headers.append('Set-Cookie', clearSessionCookie());
  return resp;
}

async function handleRemoveBg(req: Request, env: Env) {
  if (!env.REMOVEBG_API_KEY) {
    return json({ error: 'Server missing REMOVEBG_API_KEY' }, { status: 500 });
  }
  const form = await req.formData();
  const image = form.get('image');
  if (!(image instanceof File)) {
    return json({ error: 'image file is required' }, { status: 400 });
  }
  if (image.size > 10 * 1024 * 1024) {
    return json({ error: 'Image too large (max 10MB)' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('image_file', image, image.name);
  upstream.append('size', typeof form.get('size') === 'string' ? String(form.get('size')) : 'auto');

  const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': env.REMOVEBG_API_KEY },
    body: upstream,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return json({ error: text || 'remove.bg request failed' }, { status: resp.status });
  }

  return new Response(resp.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (url.pathname === '/api/auth/google/login' && req.method === 'GET') return handleGoogleLogin(req, env);
      if (url.pathname === '/api/auth/google/callback' && req.method === 'GET') return handleGoogleCallback(req, env);
      if (url.pathname === '/api/auth/logout' && req.method === 'GET') return handleLogout(req, env);
      if (url.pathname === '/api/me' && req.method === 'GET') return handleMe(req, env);
      if (url.pathname === '/api/remove-bg' && req.method === 'POST') return handleRemoveBg(req, env);
      return json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
    }
  },
};
