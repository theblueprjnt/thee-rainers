export const prerender = false;

import { env as cfEnv } from 'cloudflare:workers';

export async function POST({ request }: { request: Request }): Promise<Response> {
  try {
    const e      = cfEnv as unknown as Record<string, string>;
    const token  = e['AIRTABLE_API_KEY']  ?? '';
    const baseId = e['AIRTABLE_BASE_ID']  ?? '';
    if (!token || !baseId) return new Response('ok', { status: 200 });

    const body   = await request.json() as Record<string, string>;
    const fields = {
      Event:   body.event   ?? '',
      Page:    body.page    ?? '',
      Detail:  body.detail  ?? '',
      Session: body.session ?? '',
    };

    const write = () =>
      fetch(`https://api.airtable.com/v0/${baseId}/Events`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields }),
      });

    const res = await write();
    if (res.status !== 404) return new Response('ok', { status: 200 });

    // Table missing — attempt to create it via Airtable Metadata API
    const create = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:   'Events',
        fields: [
          { name: 'Event',   type: 'singleLineText' },
          { name: 'Page',    type: 'singleLineText' },
          { name: 'Detail',  type: 'singleLineText' },
          { name: 'Session', type: 'singleLineText' },
        ],
      }),
    });

    if (create.ok) {
      await write();
    } else {
      console.log('Create a table named Events with fields Event, Page, Detail, Session, all single line text.');
    }
  } catch { /* fail silently */ }
  return new Response('ok', { status: 200 });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
