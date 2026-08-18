// Shared Kit (ConvertKit) v4 API helpers. Single source of truth so
// subscriber/sequence logic isn't duplicated across stripe-webhook.ts and
// lead-capture.ts, which had drifted into two different (both wrong)
// shapes for the same call. Uses the X-Kit-Api-Key header, which Kit's
// docs confirm works for subscriber/tag/sequence endpoints. It does NOT
// work for the purchases endpoint (OAuth2-only) -- see stripe-webhook.ts.

export async function kitSubscriberId(apiKey: string, email: string): Promise<string | null> {
  // find-or-create
  let res = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email }),
  });
  let data: Record<string, unknown> = await res.json().catch(() => ({}));
  const subObj = data?.subscriber as Record<string, unknown> | undefined;
  if (subObj?.id) return String(subObj.id);

  // fallback: look up by email
  res = await fetch(`https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`, {
    headers: { 'X-Kit-Api-Key': apiKey },
  });
  data = await res.json().catch(() => ({}));
  const subs = data?.subscribers as Array<Record<string, unknown>> | undefined;
  return subs?.[0]?.id ? String(subs[0].id) : null;
}

// Add subscriber to a Kit sequence — no-op if sequenceId is empty/placeholder.
//
// Endpoint per https://developers.kit.com/api-reference/sequences/add-subscriber-to-sequence
// (read live, 2026-08-18, not from memory):
//   POST /v4/sequences/{sequence_id}/subscribers/{id}
//   body: {}
// The subscriber id is a URL path segment. Both prior implementations of
// this call in this codebase (stripe-webhook.ts's addToKitSequence and
// lead-capture.ts's kitEnrollSequence) instead PUT to the bare
// /subscribers endpoint with the id (or email) in the JSON body -- wrong
// shape, most likely rejected by Kit on every call. Fixed here.
//
// Logs the response body on every call, success included -- Kit can
// return 200 while silently discarding a field it didn't recognize, so
// status alone doesn't prove the enrollment actually happened.
export async function addToKitSequence(apiKey: string, email: string, sequenceId: string): Promise<void> {
  if (!apiKey || !sequenceId || sequenceId.startsWith('KIT_SEQ_')) return;
  const id = await kitSubscriberId(apiKey, email);
  if (!id) return;
  const res = await fetch(`https://api.kit.com/v4/sequences/${sequenceId}/subscribers/${id}`, {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await res.text().catch(() => '');
  if (!res.ok) {
    console.warn('[kit] sequence enroll failed', { sequenceId, subscriberId: id, status: res.status, body });
  } else {
    console.log('[kit] sequence enroll response', { sequenceId, subscriberId: id, status: res.status, body });
  }
}
