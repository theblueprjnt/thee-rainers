import { defineMiddleware } from 'astro:middleware';

const CLOSED_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Thee Rainers</title>
<style>
  body { background:#0A0A0A; color:#fff; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; text-align:center; padding:2rem; }
  p { font-size:1.1rem; opacity:0.8; }
</style>
</head>
<body>
<p>This site is no longer operating.</p>
</body>
</html>`;

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/robots.txt') {
    return next();
  }
  return new Response(CLOSED_HTML, {
    status: 410,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
});
