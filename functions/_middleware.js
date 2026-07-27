/**
 * Cloudflare Pages middleware.
 *
 * 1. Redirects www → non-www (301) so search engines see one canonical host.
 * 2. Adds a `Link` rel=canonical HTTP header as a second line of defence.
 *    (HTML-level canonical tags are handled by the Astro layout.)
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  /* ── www → non-www (must happen before any content is served) ── */
  if (url.hostname === 'www.motodok.com') {
    return Response.redirect(
      `https://motodok.com${url.pathname}${url.search}`,
      301,
    );
  }

  const response = await next();

  /* ── Canonical header on HTML pages (belt-and-suspenders) ── */
  if (
    response.headers.get('content-type')?.startsWith('text/html') &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/admin/')
  ) {
    const canonical = `https://motodok.com${url.pathname}`;
    response.headers.set('Link', `<${canonical}>; rel="canonical"`);
  }

  return response;
}
