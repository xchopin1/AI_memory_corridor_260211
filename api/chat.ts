// Vercel Serverless Function for Gemini Chat API calls
// Keeps the API key on the server side, never exposed to the browser.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, systemInstruction, userConfig } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Determine which API key and provider to use
  let apiKey = userConfig?.apiKey || process.env.GEMINI_API_KEY;
  let provider = userConfig?.provider || 'gemini';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is not configured.' });
  }

  try {
    let response;

    if (provider === 'gemini') {
      const modelName = 'gemini-1.5-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const requestBody = {
        system_instruction: {
          parts: [{ text: systemInstruction || 'You are a helpful assistant.' }]
        },
        contents: [{ parts: [{ text: message }] }],
      };

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } else {
      // OpenAI and OpenAI-compatible providers
      let apiUrl = 'https://api.openai.com/v1/chat/completions';
      let model = 'gpt-4o-mini';

      if (provider === 'deepseek') {
        apiUrl = 'https://api.deepseek.com/chat/completions';
        model = 'deepseek-chat';
      } else if (provider === 'kimi') {
        apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
        model = 'moonshot-v1-8k';
      } else if (provider === 'grok') {
        apiUrl = 'https://api.x.ai/v1/chat/completions';
        model = 'grok-beta';
      }

      const requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemInstruction || 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ]
      };

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} Chat API error:`, errorText);
      return res.status(response.status).json({ error: `${provider} API error: ${errorText}` });
    }

    const data = await response.json();
    let text;

    if (provider === 'gemini') {
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      text = data?.choices?.[0]?.message?.content;
    }

    if (!text) {
      return res.status(500).json({ error: `No response text from ${provider}.` });
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Chat API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
