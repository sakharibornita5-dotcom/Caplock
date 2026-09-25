// Vercel Edge Function — xAI/Grok proxy

export const config = {
  runtime: 'edge'
};

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
          message: 'Server is missing XAI_API_KEY.'
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

  const xaiBody = {
    model: 'grok-4.7',
    messages: body.messages,
    stream: body.stream !== false
  };

  const xaiRes = await fetch(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(xaiBody)
    }
  );

  return new Response(xaiRes.body, {
    status: xaiRes.status,
    headers: {
      'Content-Type':
        xaiRes.headers.get('Content-Type') || 'application/json'
    }
  });
}
