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
        error: { message: 'Invalid JSON request.' }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Only send fields that the xAI Chat Completions API needs.
  const cleanBody = {
    model: 'grok-4.7',
    messages: body.messages
  };

  if (!Array.isArray(cleanBody.messages)) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Frontend did not send a valid messages array.'
        }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const grokRes = await fetch(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(cleanBody)
    }
  );

  // Read the actual xAI error instead of hiding it.
  const responseText = await grokRes.text();

  if (!grokRes.ok) {
    return new Response(
      JSON.stringify({
        error: {
          message: `xAI returned HTTP ${grokRes.status}`,
          details: responseText
        }
      }),
      {
        status: grokRes.status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  return new Response(responseText, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
