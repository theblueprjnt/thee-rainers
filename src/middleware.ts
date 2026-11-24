import { defineMiddleware } from 'astro:middleware';

// Adds real HTTP range-request support for video files. Confirmed via curl
// against production that media responses always returned full 200s (no
// Accept-Ranges, Range headers ignored) -- a known cause of silent video
// playback failures on mobile Safari, which refuses to play anything it
// can't seek into. Reads the asset once per ranged request and slices it,
// which is fine at this site's video sizes (under 3MB each).
const MEDIA_EXT = /\.(mp4|webm|mov|m4v)$/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  if (!MEDIA_EXT.test(url.pathname)) return next();

  const response = await next();
  if (!response.ok || !response.body) return response;

  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    return new Response(response.body, { status: response.status, headers });
  }

  const buf = await response.arrayBuffer();
  const total = buf.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match) return response;

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
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
  headers.set('Content-Length', String(sliced.byteLength));
  headers.set('Accept-Ranges', 'bytes');

  return new Response(sliced, { status: 206, headers });
});
