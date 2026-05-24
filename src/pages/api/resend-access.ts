export const prerender = false;

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const airtableKey  = e['AIRTABLE_API_KEY']          ?? '';
  const airtableBase = e['AIRTABLE_BASE_ID']           ?? '';
  const deliveryUrl  = e['MAKE_DELIVERY_WEBHOOK_URL']  ?? '';

  let email = '';
  try {
    const body = await request.json() as Record<string, string>;
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }

  // Always return success — never leak whether an email exists
  if (!email || !EMAIL_RE.test(email) || !airtableKey || !airtableBase) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  try {
    const formula = encodeURIComponent(`LOWER({email})="${email}"`);
    const sort = encodeURIComponent('fields[]=created_at&sort[0][field]=created_at&sort[0][direction]=desc');
    const url = `https://api.airtable.com/v0/${airtableBase}/Purchases?filterByFormula=${formula}&maxRecords=1&${sort}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableKey}` },
    });

    if (!res.ok) throw new Error(`Airtable ${res.status}`);

    const data = await res.json() as { records: Array<{ fields: Record<string, string> }> };
    const record = data.records?.[0]?.fields;

    if (record && record['access_token'] && deliveryUrl) {
      await fetch(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: record['email'] ?? email,
          access_token: record['access_token'],
          access_url: `https://theerainers.com/private-architecture/${record['access_token']}`,
          resend: true,
        }),
      });
    }
  } catch (err) {
    console.error('[resend-access] error:', err);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
