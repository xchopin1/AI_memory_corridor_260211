// Vercel Serverless Function for Gemini API calls
// Types: req = IncomingMessage + body/query/cookies, res = ServerResponse + json/status/send


export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { content, language } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';
    const modelName = 'gemini-2.5-flash';

    const prompt = `CRITICAL INSTRUCTION: Analyze the provided conversation history/document content.
    OUTPUT LANGUAGE: All text fields in the JSON response MUST be in ${langName}.
    
    CONTENT TO ANALYZE:
    ${content}

    STRICT REQUIREMENTS:
    1. Identify the specific topics, speakers, and intent.
    2. Provide a 'rawContextSnippet' which is a precise description or 2-sentence quote from the source that defines the core of the discussion.
    3. Metrics should reflect the density of information or participation.
    4. interactiveWidgets should be used to provide helpful post-analysis tools like a summary checklist or a timeline of the conversation.
    5. For the 'topics' array: Extract exactly 10 to 20 of the most representative keywords or short phrases from the text. Each topic must have an accurate 'count' reflecting how many times that concept/keyword appears or is referenced in the source content. The topics should cover a wide range — from the most dominant themes to minor but meaningful keywords. Make sure the count values vary significantly so the word cloud has clear visual hierarchy.
    
    Return the analysis in JSON format based on the defined schema. Ensure every string value is in ${langName}.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            theme: {
              type: "STRING",
              enum: ['technical', 'creative', 'casual', 'educational', 'business']
            },
            summary: { type: "STRING" },
            rawContextSnippet: { type: "STRING" },
            keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
            metrics: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  label: { type: "STRING" },
                  value: { type: "NUMBER" },
                  unit: { type: "STRING" }
                }
              }
            },
            topics: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  count: { type: "NUMBER" }
                }
              }
            },
            sentiment: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  value: { type: "NUMBER" }
                }
              }
            },
            aiRecommendation: { type: "STRING" },
            interactiveWidgets: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING", enum: ['checklist', 'timeline'] },
                  content: {
                    type: "OBJECT",
                    properties: {
                      items: { type: "ARRAY", items: { type: "STRING" } },
                      language: { type: "STRING" },
                      code: { type: "STRING" },
                      events: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            time: { type: "STRING" },
                            title: { type: "STRING" },
                            description: { type: "STRING" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ["title", "theme", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
        }
      }
    };

    // Call the Gemini REST API directly (server-side, no SDK needed)
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

    // Extract the text from Gemini's response format
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No response text from Gemini.' });
    }

    const analysis = JSON.parse(text);
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
