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

const responseText = await grokRes.text();

if (!grokRes.ok) {
  let details = responseText;

  try {
    const parsed = JSON.parse(responseText);
    details =
      parsed?.error?.message ||
      parsed?.message ||
      responseText;
  } catch {
    // Keep the raw response if it isn't JSON.
  }

  return new Response(
    JSON.stringify({
      error: {
        message: `xAI error ${grokRes.status}: ${details}`
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
