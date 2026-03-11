// Vercel Serverless Function for Gemini Chat API calls
// Keeps the API key on the server side, never exposed to the browser.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { message, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const modelName = 'gemini-2.5-flash';

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemInstruction || 'You are a helpful assistant.' }]
      },
      contents: [{ parts: [{ text: message }] }],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini Chat API error:', errorText);
      return res.status(geminiResponse.status).json({ error: `Gemini API error: ${errorText}` });
    }

    const geminiData = await geminiResponse.json();

    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No response text from Gemini.' });
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Chat API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
