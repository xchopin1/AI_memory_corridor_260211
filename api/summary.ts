// Vercel Serverless Function for multi-provider history summary
// Types: req = IncomingMessage + body/query/cookies, res = ServerResponse + json/status/send

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summaries, language, userConfig } = req.body;

  if (!summaries || !Array.isArray(summaries) || summaries.length === 0) {
    return res.status(400).json({ error: 'Summaries array is required.' });
  }

  // Determine which API key and provider to use
  let apiKey = userConfig?.apiKey || process.env.GEMINI_API_KEY;
  let provider = userConfig?.provider || 'gemini';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is not configured.' });
  }

  try {
    const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';
    
    // Build a condensed representation of all past analyses
    const archiveSummaries = summaries.map((s: any, i: number) =>
      `[Archive ${i + 1}] Title: "${s.title}" | Theme: ${s.theme} | Summary: ${s.summary}`
    ).join('\n');

    const prompt = `You are an AI that performs a comprehensive meta-analysis across multiple conversation archives.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire summary in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain exactly the same number of insights, themes, patterns, and recommendations, just translated literally.
    
    Below are summaries of ${summaries.length} previously analyzed conversation archives:
    
    ${archiveSummaries}
    
    Based on ALL these archives, produce a JSON response with the following in both languages:
    1. "overallSummary": A comprehensive 3-5 paragraph narrative.
    2. "keyInsights": An array of 5-8 key insights.
    3. "topThemes": An array of objects with "theme" (string) and "count" (number).
    4. "interactionPatterns": An array of 3-5 strings.
    5. "recommendations": An array of 3-5 personalized recommendations.
    
    Return the analysis in JSON format with the following structure:
    {
      "en": { "overallSummary": "...", "keyInsights": ["..."], "topThemes": [{"theme": "...", "count": 0}], "interactionPatterns": ["..."], "recommendations": ["..."] },
      "zh": { ... same structure in Chinese ... }
    }`;

    let response;
    if (provider === 'gemini') {
      const modelName = 'gemini-1.5-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
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
          { role: 'system', content: 'You are a helpful AI that analyzes history and returns JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
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
      console.error(`${provider} API error:`, errorText);
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

    const analysis = JSON.parse(text);
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Summary API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
