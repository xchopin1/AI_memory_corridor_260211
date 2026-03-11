import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Custom Vite plugin to handle /api/analyze during local development
function localApiPlugin(env: Record<string, string>) {
  return {
    name: 'local-api-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/analyze', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const { content, language } = JSON.parse(body);
            const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
            
            if (!apiKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }));
              return;
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
    5. For the 'topics' array: Extract exactly 10 to 20 of the most representative keywords or short phrases from the text. Each topic must have an accurate 'count' reflecting how many times that concept/keyword appears or is referenced in the source content.
    
    Return the analysis in JSON format based on the defined schema. Ensure every string value is in ${langName}.`;

            const requestBody = {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    theme: { type: "STRING", enum: ['technical', 'creative', 'casual', 'educational', 'business'] },
                    summary: { type: "STRING" },
                    rawContextSnippet: { type: "STRING" },
                    keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                    metrics: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "NUMBER" }, unit: { type: "STRING" } } } },
                    topics: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, count: { type: "NUMBER" } } } },
                    sentiment: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, value: { type: "NUMBER" } } } },
                    aiRecommendation: { type: "STRING" },
                    interactiveWidgets: { type: "ARRAY", items: { type: "OBJECT", properties: { type: { type: "STRING", enum: ['checklist', 'code-snippet', 'timeline'] }, content: { type: "OBJECT", properties: { items: { type: "ARRAY", items: { type: "STRING" } }, language: { type: "STRING" }, code: { type: "STRING" }, events: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, title: { type: "STRING" }, description: { type: "STRING" } } } } } } } } }
                  },
                  required: ["title", "theme", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
                }
              }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            if (!geminiRes.ok) {
              const errorText = await geminiRes.text();
              res.statusCode = geminiRes.status;
              res.end(JSON.stringify({ error: `Gemini API error: ${errorText}` }));
              return;
            }

            const geminiData = await geminiRes.json();
            const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'No response text from Gemini.' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(text); // text is already JSON
          } catch (error: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
          }
        });
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

