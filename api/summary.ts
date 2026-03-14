// Vercel Serverless Function for generating meta-summary of all memory archives

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { summaries, language } = req.body;

    if (!summaries || !Array.isArray(summaries) || summaries.length === 0) {
      return res.status(400).json({ error: 'Summaries array is required.' });
    }

    const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';
    const modelName = 'gemini-2.5-flash';

    // Build a condensed representation of all past analyses
    const archiveSummaries = summaries.map((s: any, i: number) =>
      `[Archive ${i + 1}] Title: "${s.title}" | Theme: ${s.theme} | Summary: ${s.summary}`
    ).join('\n');

    const prompt = `You are an AI that performs a comprehensive meta-analysis across multiple conversation archives.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire summary in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain exactly the same number of insights, themes, patterns, and recommendations, just translated literally.
    
    Below are summaries of ${summaries.length} previously analyzed conversation archives:
    
    ${archiveSummaries}
    
    Based on ALL these archives, produce a JSON response with the following in both languages:
    1. "overallSummary": A comprehensive 3-5 paragraph narrative summarizing the user's overall AI interaction patterns, recurring interests, intellectual tendencies, and evolution of topics over time. Be insightful and reflective.
    2. "keyInsights": An array of 5-8 key insights about the user's interaction history (e.g. "You frequently explore philosophical topics related to consciousness", "Your technical discussions show a strong focus on web development").
    3. "topThemes": An array of objects with "theme" (string) and "count" (number) representing how many archives fall into each theme category.
    4. "interactionPatterns": An array of 3-5 strings describing behavioral patterns (e.g. "You tend to have longer conversations about coding topics", "Your emotional discussions are often followed by advice-seeking").
    5. "recommendations": An array of 3-5 personalized recommendations for future AI interactions based on the analysis.
    
    Be thoughtful, personal, and data-driven in your analysis. Reference specific archive themes and patterns.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            en: {
              type: "OBJECT",
              properties: {
                overallSummary: { type: "STRING" },
                keyInsights: { type: "ARRAY", items: { type: "STRING" } },
                topThemes: { type: "ARRAY", items: { type: "OBJECT", properties: { theme: { type: "STRING" }, count: { type: "NUMBER" } } } },
                interactionPatterns: { type: "ARRAY", items: { type: "STRING" } },
                recommendations: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["overallSummary", "keyInsights", "topThemes", "interactionPatterns", "recommendations"]
            },
            zh: {
              type: "OBJECT",
              properties: {
                overallSummary: { type: "STRING" },
                keyInsights: { type: "ARRAY", items: { type: "STRING" } },
                topThemes: { type: "ARRAY", items: { type: "OBJECT", properties: { theme: { type: "STRING" }, count: { type: "NUMBER" } } } },
                interactionPatterns: { type: "ARRAY", items: { type: "STRING" } },
                recommendations: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["overallSummary", "keyInsights", "topThemes", "interactionPatterns", "recommendations"]
            }
          },
          required: ["en", "zh"]
        }
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(geminiResponse.status).json({ error: `Gemini API error: ${errorText}` });
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No response text from Gemini.' });
    }

    const analysis = JSON.parse(text);
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Summary API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
