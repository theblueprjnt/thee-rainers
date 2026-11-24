// Range-request-capable video proxy. Cloudflare serves /videos/* directly
// from its edge/static-asset layer, bypassing the Worker entirely -- so
// middleware can never see those requests, confirmed by curl against
// production (always 200, never 206, even with a Range header, same
// etag before and after a middleware-based fix was deployed). API routes
// always invoke the Worker, so this proxy is the one place that can
// actually slice the file and answer Range requests, which mobile
// Safari requires in order to play video at all.
export const prerender = false;

const ALLOWED_FILES = new Set([
  'hero.mp4',
  'base-steps.mp4',
  'base-gallop.mp4',
  'base-pivot.mp4',
  'base-pendulum.mp4',
]);

export async function GET({ request, url }: { request: Request; url: URL }): Promise<Response> {
  const file = url.searchParams.get('file') ?? '';
  if (!ALLOWED_FILES.has(file)) {
    return new Response('Not found', { status: 404 });
  }

  const assetUrl = new URL(`/videos/${file}`, url.origin);
  const assetRes = await fetch(assetUrl.toString());
  if (!assetRes.ok) {
    return new Response('Not found', { status: 404 });
  }

  const buf = await assetRes.arrayBuffer();
  const total = buf.byteLength;
  const range = request.headers.get('range');

  const baseHeaders = new Headers({
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  if (!range) {
    baseHeaders.set('Content-Length', String(total));
    return new Response(buf, { status: 200, headers: baseHeaders });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) {
    baseHeaders.set('Content-Length', String(total));
    return new Response(buf, { status: 200, headers: baseHeaders });
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : total - 1;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= total) end = total - 1;

  if (start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const sliced = buf.slice(start, end + 1);
  baseHeaders.set('Content-Range', `bytes ${start}-${end}/${total}`);
  baseHeaders.set('Content-Length', String(sliced.byteLength));

  return new Response(sliced, { status: 206, headers: baseHeaders });
}
