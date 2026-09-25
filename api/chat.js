// Vercel Edge Function — proxies chat requests to xAI Grok.
// The API key stays on the server and is never exposed to the browser.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: { message: 'Method not allowed' }
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            'Server is missing XAI_API_KEY. Add it in Vercel → Settings → Environment Variables.'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  let body;

  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid request body' }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Make sure the request uses an xAI/Grok model.
  body.model = body.model || 'grok-4.7';

  const grokRes = await fetch(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(body)
    }
  );

  const responseHeaders = {
    'Content-Type':
      grokRes.headers.get('Content-Type') || 'application/json'
  };

  // Pass rate-limit information back to the frontend.
  [
    'x-ratelimit-limit-requests',
    'x-ratelimit-remaining-requests',
    'x-ratelimit-reset-requests',
    'x-ratelimit-limit-tokens',
    'x-ratelimit-remaining-tokens',
    'x-ratelimit-reset-tokens',
    'retry-after'
  ].forEach((header) => {
    const value = grokRes.headers.get(header);

    if (value) {
      responseHeaders[header] = value;
    }
  });

  return new Response(grokRes.body, {
    status: grokRes.status,
    headers: responseHeaders
  });
}
