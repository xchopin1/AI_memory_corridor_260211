// Vercel Serverless Function for multi-provider AI analysis
// Types: req = IncomingMessage + body/query/cookies, res = ServerResponse + json/status/send

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, language, userConfig } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required.' });
  }

  // Determine which API key and provider to use
  let apiKey = userConfig?.apiKey || process.env.GEMINI_API_KEY;
  let provider = userConfig?.provider || 'gemini';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is not configured.' });
  }

  try {
    const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';
    
    // Prompt structure 
    const prompt = `CRITICAL INSTRUCTION: Analyze the provided conversation history/document content.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire analysis in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain identical sets of data metrics, topics count, and structure, just translated literally.
    
    CONTENT TO ANALYZE:
    ${content}

    =====================================================
    THEME CLASSIFICATION — MECE FRAMEWORK
    =====================================================
    Classify the conversation into EXACTLY ONE theme from: ['technical', 'creative', 'casual', 'educational', 'business', 'analytical', 'philosophical', 'emotional', 'entertainment', 'planning', 'coding', 'brainstorming', 'storytelling', 'troubleshooting', 'debate', 'advice', 'roleplay', 'productivity', 'other'].
    
    Return the analysis in JSON format with the following structure:
    {
      "theme": "...",
      "en": { "title": "...", "summary": "...", "rawContextSnippet": "...", "keyTakeaways": ["..."], "metrics": [{"label": "...", "value": 0, "unit": "..."}], "topics": [{"name": "...", "count": 0}], "sentiment": [{"name": "...", "value": 0}], "aiRecommendation": "...", "interactiveWidgets": [{"type": "checklist", "content": {"items": ["..."]}}] },
      "zh": { ... same structure in Chinese ... }
    }
    Ensure all strings in 'en' are English and 'zh' are Chinese.`;

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
          { role: 'system', content: 'You are a helpful AI that analyzes conversations and returns JSON only.' },
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
    console.error('API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
