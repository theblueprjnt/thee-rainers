// Range-request-capable video proxy. Cloudflare serves /videos/* directly
// from its edge/static-asset layer, bypassing the Worker entirely -- so
// middleware can never see those requests, confirmed by curl against
// production (always 200, never 206, even with a Range header, same
// etag before and after a middleware-based fix was deployed). API routes
// always invoke the Worker, so this proxy is the one place that can
// actually slice the file and answer Range requests, which mobile
// Safari requires in order to play video at all.
//
// A plain fetch() back to the site's own public URL does not work here --
// confirmed via a live 522 (Cloudflare's own connection-timeout code): in
// a Workers-with-assets deployment there is no real origin server behind
// the zone, so self-fetching over the public internet has nothing to
// connect to. The ASSETS binding (cloudflare:workers env, same one wired
// in wrangler.jsonc) is the documented way to read a static asset from
// inside the Worker itself.
//
// Forward the incoming Range header straight into the ASSETS fetch and
// pass its response straight back, rather than buffering the whole file
// into Worker memory and slicing it by hand on every request (including
// every small probe range request a browser makes while starting
// playback). The ASSETS binding is Cloudflare's real static-file layer;
// it understands Range natively, so there is nothing to reimplement.
import { env as cfEnv } from 'cloudflare:workers';

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

  const assets = (cfEnv as unknown as { ASSETS?: { fetch(req: Request): Promise<Response> } }).ASSETS;
  if (!assets) {
    return new Response('ASSETS binding not available', { status: 500 });
  }

  const assetUrl = new URL(`/videos/${file}`, url.origin);
  const forwardedHeaders = new Headers();
  const range = request.headers.get('range');
  if (range) forwardedHeaders.set('range', range);

  const assetRes = await assets.fetch(new Request(assetUrl.toString(), { headers: forwardedHeaders }));
  if (!assetRes.ok && assetRes.status !== 206 && assetRes.status !== 416) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers(assetRes.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(assetRes.body, { status: assetRes.status, headers });
}
