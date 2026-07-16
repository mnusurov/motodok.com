export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/api/auth') {
    const state = crypto.randomUUID();
    const githubUrl = new URL('https://github.com/login/oauth/authorize');
    githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback`);
    githubUrl.searchParams.set('scope', 'repo,user');
    githubUrl.searchParams.set('state', state);
    return Response.redirect(githubUrl.toString(), 302);
  }

  if (url.pathname.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response('Missing code', { status: 400 });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenResponse.json();

    const token = tokenData.access_token;
    const status = token ? 'success' : 'error';

    return new Response(
      `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  (function() {
    function receiveMessage(message) {
      window.opener.postMessage(
        'authorization:github:${status}:${JSON.stringify({ token: token || '' })}',
        '*'
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
<p>Authorizing Decap CMS...</p>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  return new Response('Not found', { status: 404 });
}
