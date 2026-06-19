// Fire-and-forget Telegram alert. Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from env.
// Never throws — silently skips if env vars are missing.
export async function sendTelegramAlert(token: string, chatId: string, text: string): Promise<void> {
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // intentional — never block the main response
  }
}
