import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Custom Vite plugin to handle /api/analyze during local development
function localApiPlugin(env: Record<string, string>) {
  return {
    name: 'local-api-proxy',
    configureServer(server: any) {
      // Helper to parse JSON body
      const getBody = (req: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(e); }
          });
        });
      };

      const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
      const modelName = 'gemini-1.5-flash';

      // Handle /api/analyze
      server.middlewares.use('/api/analyze', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { content, language, userConfig } = await getBody(req);
          
          let currentApiKey = userConfig?.apiKey || apiKey;
          let currentProvider = userConfig?.provider || 'gemini';

          if (!currentApiKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'API Key is not set' }));
            return;
          }

          const prompt = `CRITICAL INSTRUCTION: Analyze the provided conversation history/document content.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire analysis in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain identical sets of data metrics, topics count, and structure, just translated literally.
    
    CONTENT TO ANALYZE:
    ${content}

    =====================================================
    THEME CLASSIFICATION — MECE FRAMEWORK
    =====================================================
    You MUST classify the conversation into EXACTLY ONE theme from the following list:
    'technical', 'creative', 'casual', 'educational', 'business', 'analytical', 'philosophical', 'emotional', 'entertainment', 'planning', 'coding', 'brainstorming', 'storytelling', 'troubleshooting', 'debate', 'advice', 'roleplay', 'productivity', 'other'
    
    Return the analysis in JSON format based on the defined schema. Ensure 'en' object strings are purely English and 'zh' object strings are purely Chinese.`;

          let response;
          if (currentProvider === 'gemini') {
            const requestBody = {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    theme: { type: "STRING" },
                    en: {
                      type: "OBJECT",
                      properties: {
                        title: { type: "STRING" },
                        summary: { type: "STRING" },
                        rawContextSnippet: { type: "STRING" },
                        keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                        metrics: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "NUMBER" }, unit: { type: "STRING" } } } },
                        topics: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, count: { type: "NUMBER" } } } },
                        sentiment: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, value: { type: "NUMBER" } } } },
                        aiRecommendation: { type: "STRING" },
                        interactiveWidgets: { type: "ARRAY", items: { type: "OBJECT", properties: { type: { type: "STRING" }, content: { type: "OBJECT" } } } }
                      },
                      required: ["title", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
                    },
                    zh: {
                      type: "OBJECT",
                      properties: {
                        title: { type: "STRING" },
                        summary: { type: "STRING" },
                        rawContextSnippet: { type: "STRING" },
                        keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                        metrics: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "NUMBER" }, unit: { type: "STRING" } } } },
                        topics: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, count: { type: "NUMBER" } } } },
                        sentiment: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, value: { type: "NUMBER" } } } },
                        aiRecommendation: { type: "STRING" },
                        interactiveWidgets: { type: "ARRAY", items: { type: "OBJECT", properties: { type: { type: "STRING" }, content: { type: "OBJECT" } } } }
                      },
                      required: ["title", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
                    }
                  },
                  required: ["theme", "en", "zh"]
                }
              }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });
          } else {
            // OpenAI and OpenAI-compatible providers
            let apiUrl = 'https://api.openai.com/v1/chat/completions';
            let modelName = 'gpt-4o-mini';

            if (currentProvider === 'deepseek') {
              apiUrl = 'https://api.deepseek.com/chat/completions';
              modelName = 'deepseek-chat';
            } else if (currentProvider === 'kimi') {
              apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
              modelName = 'moonshot-v1-8k';
            } else if (currentProvider === 'grok') {
              apiUrl = 'https://api.x.ai/v1/chat/completions';
              modelName = 'grok-beta';
            }

            const requestBody = {
              model: modelName,
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
                'Authorization': `Bearer ${currentApiKey}`
              },
              body: JSON.stringify(requestBody),
            });
          }

          if (!response.ok) {
            const errorText = await response.text();
            res.statusCode = response.status;
            res.end(JSON.stringify({ error: `${currentProvider} API error: ${errorText}` }));
            return;
          }

          const data = await response.json();
          let text;
          if (currentProvider === 'gemini') {
            text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            text = data?.choices?.[0]?.message?.content;
          }

          if (!text) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `No response text from ${currentProvider}.` }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });

      // Handle /api/summary
      server.middlewares.use('/api/summary', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { summaries, language, userConfig } = await getBody(req);
          
          let currentApiKey = userConfig?.apiKey || apiKey;
          let currentProvider = userConfig?.provider || 'gemini';

          if (!currentApiKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'API Key is not set' }));
            return;
          }

          const archiveSummaries = summaries.map((s: any, i: number) =>
            `[Archive ${i + 1}] Title: "${s.title}" | Theme: ${s.theme} | Summary: ${s.summary}`
          ).join('\n');

          const prompt = `You are an AI that performs a comprehensive meta-analysis across multiple conversation archives.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire summary in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain exactly the same number of insights, themes, patterns, and recommendations, just translated literally.
    
    Below are summaries of ${summaries.length} previously analyzed conversation archives:
    
    ${archiveSummaries}
    
    Based on ALL these archives, produce a JSON response with the following in both languages:
    1. "overallSummary": A comprehensive narrative summarizing interaction patterns.
    2. "keyInsights": Array of 5-8 insights.
    3. "topThemes": Array of objects {theme, count}.
    4. "interactionPatterns": Array of 3-5 strings.
    5. "recommendations": Array of 3-5 recommendations.`;

          let response;
          if (currentProvider === 'gemini') {
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

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });
          } else {
             // OpenAI and OpenAI-compatible providers
             let apiUrl = 'https://api.openai.com/v1/chat/completions';
             let modelName = 'gpt-4o-mini';
 
             if (currentProvider === 'deepseek') {
               apiUrl = 'https://api.deepseek.com/chat/completions';
               modelName = 'deepseek-chat';
             } else if (currentProvider === 'kimi') {
               apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
               modelName = 'moonshot-v1-8k';
             } else if (currentProvider === 'grok') {
               apiUrl = 'https://api.x.ai/v1/chat/completions';
               modelName = 'grok-beta';
             }
 
             const requestBody = {
               model: modelName,
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
                 'Authorization': `Bearer ${currentApiKey}`
               },
               body: JSON.stringify(requestBody),
             });
          }

          if (!response.ok) {
            const errorText = await response.text();
            res.statusCode = response.status;
            res.end(JSON.stringify({ error: `${currentProvider} API error: ${errorText}` }));
            return;
          }

          const data = await response.json();
          let text;
          if (currentProvider === 'gemini') {
            text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            text = data?.choices?.[0]?.message?.content;
          }

          if (!text) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `No response text from ${currentProvider}.` }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });

      // Handle /api/chat
      server.middlewares.use('/api/chat', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const { message, systemInstruction, userConfig } = await getBody(req);
          
          let currentApiKey = userConfig?.apiKey || apiKey;
          let currentProvider = userConfig?.provider || 'gemini';

          if (!currentApiKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'API Key is not set' }));
            return;
          }

          let response;
          if (currentProvider === 'gemini') {
            const requestBody = {
              system_instruction: {
                parts: [{ text: systemInstruction || 'You are a helpful assistant.' }]
              },
              contents: [{ parts: [{ text: message }] }],
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentApiKey}`;
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });
          } else {
            // OpenAI and OpenAI-compatible providers
            let apiUrl = 'https://api.openai.com/v1/chat/completions';
            let model = 'gpt-4o-mini';

            if (currentProvider === 'deepseek') {
              apiUrl = 'https://api.deepseek.com/chat/completions';
              model = 'deepseek-chat';
            } else if (currentProvider === 'kimi') {
              apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
              model = 'moonshot-v1-8k';
            } else if (currentProvider === 'grok') {
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
                'Authorization': `Bearer ${currentApiKey}`
              },
              body: JSON.stringify(requestBody),
            });
          }

          if (!response.ok) {
            const errorText = await response.text();
            res.statusCode = response.status;
            res.end(JSON.stringify({ error: `${currentProvider} API error: ${errorText}` }));
            return;
          }

          const data = await response.json();
          let text;

          if (currentProvider === 'gemini') {
            text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            text = data?.choices?.[0]?.message?.content;
          }

          if (!text) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: `No response text from ${currentProvider}.` }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ text }));
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), localApiPlugin(env)],
    build: {
      target: 'esnext',
    },
    esbuild: {
      target: 'esnext',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

