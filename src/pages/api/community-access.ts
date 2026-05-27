export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request }: { request: Request }): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { email } = await request.json() as { email?: string };
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ access: false }), { status: 400, headers });
    }

    const e = cfEnv as unknown as Record<string, string>;
    const airtableToken = e['AIRTABLE_API_KEY'] ?? '';
    const airtableBase  = e['AIRTABLE_BASE_ID'] ?? '';
    const airtableTable = e['AIRTABLE_TABLE'] ?? 'Members';

    if (!airtableToken || !airtableBase) {
      return new Response(JSON.stringify({ access: false }), { status: 500, headers });
    }

    const url = `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}` +
      `?filterByFormula=${encodeURIComponent(`AND({Email}="${email.toLowerCase()}",{Product}="greatness")`)}` +
      `&fields%5B%5D=Status&fields%5B%5D=Email&maxRecords=1`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });

    if (!res.ok) {
      console.error('[community-access] Airtable error:', res.status);
      return new Response(JSON.stringify({ access: false }), { status: 500, headers });
    }

    const data = await res.json() as { records: Array<{ fields: Record<string, string> }> };
    const record = data.records?.[0];
    const status = record?.fields?.Status ?? '';

    // active or past_due (Smart Retries still running) both get access
    const hasAccess = status === 'active' || status === 'trialing' || status === 'past_due';

    return new Response(JSON.stringify({ access: hasAccess }), { headers });
  } catch (err) {
    console.error('[community-access] error:', String(err));
    return new Response(JSON.stringify({ access: false }), { status: 500, headers });
  }
}
