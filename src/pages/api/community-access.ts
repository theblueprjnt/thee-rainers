export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

// Defensive: any failure (missing env, Airtable error, parse error) returns
// 200 with access:false. The user sees "no active membership found" — consistent
// with the legitimate not-found case. Only 400 is returned for malformed input.
// Errors are logged for diagnosis but never surface as 5xx to the gate page.

function deny(headers: Record<string, string>): Response {
  return new Response(JSON.stringify({ access: false }), { status: 200, headers });
}

export async function POST({ request }: { request: Request }): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  let email = '';
  try {
    const body = await request.json() as { email?: string };
    email = (body.email ?? '').trim();
  } catch {
    return new Response(JSON.stringify({ access: false, error: 'bad_request' }), { status: 400, headers });
  }
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ access: false, error: 'invalid_email' }), { status: 400, headers });
  }

  const e = cfEnv as unknown as Record<string, string>;
  const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
  const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
  const airtableTable = e['AIRTABLE_TABLE'] ?? 'Members';

  if (!airtableToken || !airtableBase) {
    console.error('[community-access] AIRTABLE_API_KEY or AIRTABLE_BASE_ID not set');
    return deny(headers);
  }

  try {
    const url = `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}` +
      `?filterByFormula=${encodeURIComponent(`AND({Email}="${email.toLowerCase()}",{Product}="greatness")`)}` +
      `&fields%5B%5D=Status&fields%5B%5D=Email&maxRecords=1`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[community-access] Airtable', res.status, detail.slice(0, 200));
      return deny(headers);
    }

    const data = await res.json() as { records?: Array<{ fields: Record<string, string> }> };
    const status = data.records?.[0]?.fields?.Status ?? '';
    const hasAccess = status === 'active' || status === 'trialing' || status === 'past_due';

    return new Response(JSON.stringify({ access: hasAccess }), { status: 200, headers });
  } catch (err) {
    console.error('[community-access] fetch error:', String(err));
    return deny(headers);
  }
}
