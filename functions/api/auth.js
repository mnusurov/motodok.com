export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/api/auth') {
    const githubUrl = new URL('https://github.com/login/oauth/authorize');
    githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback`);
    githubUrl.searchParams.set('scope', 'repo');
    return Response.redirect(githubUrl.toString(), 302);
  }

  if (url.pathname === '/api/auth/callback') {
    const code = url.searchParams.get('code');
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
    return Response.redirect(`${url.origin}/admin/#access_token=${tokenData.access_token}`, 302);
  }

  return new Response('Not found', { status: 404 });
}
