export type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
};

export async function exchangeCodeForTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await resp.json<any>();
  if (!resp.ok) {
    throw new Error(data?.error_description || data?.error || 'Failed to exchange Google auth code');
  }

  return data as {
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type: string;
  };
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json<any>();
  if (!resp.ok) {
    throw new Error(data?.error_description || data?.error || 'Failed to fetch Google user info');
  }
  return data as GoogleUserInfo;
}
