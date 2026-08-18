// One-time OAuth authorization callback for Kit's purchases API. Visit
// this by starting at the authorization URL (see below), approving access
// in Kit, and being redirected back here with a `code` param. Exchanges
// it for tokens and stores the refresh token in KV. Not needed again
// unless access is revoked and re-authorized from scratch.
//
// Authorization URL (fill in the real client id, this file never sees it
// until the redirect comes back):
// https://api.kit.com/v4/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://theerainers.com/api/kit-oauth-callback

export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { exchangeCodeForTokens, storeInitialRefreshToken } from '../../lib/kit-oauth';

const SITE_URL = 'https://theerainers.com';
const REDIRECT_URI = `${SITE_URL}/api/kit-oauth-callback`;

export async function GET({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');

  const html = (title: string, body: string, status: number) =>
    new Response(
      `<html><body style="font-family:monospace;padding:40px;max-width:560px;margin:0 auto;"><h1>${title}</h1><p>${body}</p></body></html>`,
      { status, headers: { 'Content-Type': 'text/html' } },
    );

  if (oauthError) {
    return html('Authorization failed', `Kit returned: ${oauthError}`, 400);
  }
  if (!code) {
    return html('Missing code', 'No authorization code in the callback URL. Start from the authorization URL, not this page directly.', 400);
  }

  const clientId = e['KIT_OAUTH_CLIENT_ID'] ?? '';
  const clientSecret = e['KIT_OAUTH_CLIENT_SECRET'] ?? '';
  if (!clientId || !clientSecret) {
    return html('Server misconfigured', 'KIT_OAUTH_CLIENT_ID / KIT_OAUTH_CLIENT_SECRET not set.', 500);
  }

  try {
    const tokens = await exchangeCodeForTokens(clientId, clientSecret, code, REDIRECT_URI);
    const kv = (cfEnv as unknown as { SESSION?: { put(k: string, v: string): Promise<void> } }).SESSION;
    if (!kv) {
      return html('Server misconfigured', 'SESSION KV binding not available.', 500);
    }
    await storeInitialRefreshToken(kv, tokens.refresh_token);
    console.log('[kit-oauth-callback] refresh token stored successfully');
    return html('Kit connected', 'Refresh token stored. This page is safe to close. It does not need to be visited again unless access is revoked.', 200);
  } catch (err) {
    console.error('[kit-oauth-callback] error:', String(err));
    return html('Token exchange failed', 'Check the Worker logs for details.', 500);
  }
}
