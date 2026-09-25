export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method not allowed' } }),
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
        error: { message: 'XAI_API_KEY is missing from Vercel.' }
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
  } catch {
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid JSON request body.' }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const xaiBody = {
    model: 'grok-4.7',
    messages: body.messages,
    stream: true
  };

  try {
    const xaiRes = await fetch(
      'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(xaiBody)
      }
    );

    // IMPORTANT: expose xAI's actual error instead of just "HTTP 400"
    if (!xaiRes.ok) {
      const detail = await xaiRes.text();

      return new Response(
        JSON.stringify({
          error: {
            message: `xAI returned HTTP ${xaiRes.status}: ${detail}`
          }
        }),
        {
          status: xaiRes.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Keep the streaming response intact
    return new Response(xaiRes.body, {
      status: 200,
      headers: {
        'Content-Type':
          xaiRes.headers.get('Content-Type') || 'text/event-stream'
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message: error?.message || 'Failed to connect to xAI.'
        }
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
