// Fire-and-forget Telegram alert. Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from env.
// Never throws — silently skips if env vars are missing.
export async function sendTelegramAlert(token: string, chatId: string, text: string): Promise<void> {
  if (!token || !chatId) {
    console.warn('[telegram] skipped — missing token or chatId', { hasToken: !!token, hasChatId: !!chatId });
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('[telegram] sendMessage failed', res.status, await res.text().catch(() => ''));
    } else {
      console.log('[telegram] sendMessage ok');
    }
  } catch (err) {
    console.error('[telegram] sendMessage fetch error', String(err));
  }
}
