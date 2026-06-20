export const prerender = false;

// GET /api/ping?secret=CRON_SECRET
// Sends a test Telegram message and returns status. Delete after confirming Telegram works.

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';
import { sendTelegramAlert } from '../../lib/telegram';

export async function GET({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const cronSecret = e['CRON_SECRET'] ?? '';
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') ?? '';

  if (!cronSecret || secret !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token  = e['TELEGRAM_BOT_TOKEN'] ?? '';
  const chatId = e['TELEGRAM_CHAT_ID'] ?? '';

  if (!token || !chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in Cloudflare env vars' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: 'Thee Rainers — Telegram connected. Sales alerts are live.' }),
      signal: AbortSignal.timeout(8000),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
    });
    return new Response(JSON.stringify({ ok: true, message: 'Telegram message sent.' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
