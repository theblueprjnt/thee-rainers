export const prerender = false;

// GET /api/ping?secret=YOUR_TELEGRAM_BOT_TOKEN
// Sends a test Telegram message. Auth = the bot token itself (self-validating).
// Delete this file once Telegram is confirmed working.

import type { APIContext } from 'astro';
import { env as cfEnv } from 'cloudflare:workers';

export async function GET({ request }: APIContext): Promise<Response> {
  const e = cfEnv as unknown as Record<string, string>;
  const token  = e['TELEGRAM_BOT_TOKEN'] ?? '';
  const chatId = e['TELEGRAM_CHAT_ID'] ?? '';
  const url    = new URL(request.url);
  const secret = url.searchParams.get('secret') ?? '';

  if (!token || secret !== token) {
    return new Response(JSON.stringify({ ok: false, error: 'Wrong secret or TELEGRAM_BOT_TOKEN not set in Cloudflare env vars' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'TELEGRAM_CHAT_ID not set in Cloudflare env vars' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: 'Thee Rainers — Telegram connected. Sales alerts are live.' }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Telegram API error', detail: data }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, message: 'Message sent to Telegram.' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
