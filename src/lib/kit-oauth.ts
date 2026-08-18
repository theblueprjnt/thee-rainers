// Kit OAuth2 helpers. Every detail here (endpoint URLs, request shapes,
// rotation behavior) confirmed live against developers.kit.com on
// 2026-08-18, not from memory -- required for the purchases endpoint,
// which the X-Kit-Api-Key header (used everywhere else in this codebase)
// does not work for.
//
// Kit rotates refresh tokens on every use: "Refresh tokens are single-use.
// The response returns a new refresh_token -- store it and use it on the
// next refresh. The refresh token you just submitted is now revoked."
// A static Cloudflare secret can't hold this -- it changes on every call.
// Persisted in the SESSION KV namespace instead, since the Worker can
// read/write KV at runtime but can't rewrite its own secrets.

const TOKEN_URL = 'https://api.kit.com/v4/oauth/token';
const KV_KEY = 'kit:oauth:refresh_token';

interface KitTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<KitTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Kit token exchange failed: ${res.status} ${body}`);
  return JSON.parse(body) as KitTokenResponse;
}

// No client_secret in this request -- confirmed against the docs, the
// refresh request body only takes client_id, grant_type, refresh_token.
async function refreshAccessToken(clientId: string, refreshToken: string): Promise<KitTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Kit token refresh failed: ${res.status} ${body}`);
  return JSON.parse(body) as KitTokenResponse;
}

export async function storeInitialRefreshToken(kv: KVNamespace, refreshToken: string): Promise<void> {
  await kv.put(KV_KEY, refreshToken);
}

// Reads the stored refresh token, exchanges it for a fresh access token,
// and immediately persists the new (rotated) refresh token before
// returning the access token. If the caller's actual purchase POST fails
// after this, the token is still correctly rotated and saved for next
// time -- refreshing again with the old token would just fail with
// invalid_grant, so there's no safe way to "undo" the rotation anyway.
// Returns null if nothing has been connected yet (no stored token) or the
// refresh itself fails, logged either way rather than thrown -- a Kit
// outage must never fail the Stripe webhook it's called from.
export async function getKitAccessToken(kv: KVNamespace, clientId: string): Promise<string | null> {
  const storedRefreshToken = await kv.get(KV_KEY);
  if (!storedRefreshToken) {
    console.error('[kit-oauth] no refresh token stored yet -- visit /api/kit-oauth-callback\'s authorization flow first');
    return null;
  }
  try {
    const tokens = await refreshAccessToken(clientId, storedRefreshToken);
    await kv.put(KV_KEY, tokens.refresh_token);
    return tokens.access_token;
  } catch (err) {
    console.error('[kit-oauth] refresh failed:', String(err));
    return null;
  }
}
