
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisSource } from "../types";

export const analyzeChatHistory = async (content: string, url?: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct a prompt that prioritizes content but allows URL grounding
  let prompt = `Analyze the following chat history.`;
  if (content && content.trim().length > 0) {
    prompt += `\n\nChat Content to analyze:\n${content}`;
  }
  
  if (url) {
    prompt += `\n\nPlease also check the content at this specific URL using your search tools: ${url}`;
  }

  prompt += `
    Extract the main theme, metrics, key topics, and sentiment.
    If the content provided is a URL, use your Google Search tool to find the actual dialogue content.
    Return the analysis in JSON format based on the defined schema.
    For interactiveWidgets:
    - If type is 'checklist', provide 'items' (array of strings).
    - If type is 'code-snippet', provide 'language' and 'code'.
    - If type is 'timeline', provide 'events' (array of objects with time, title, and description).
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          theme: { 
            type: Type.STRING, 
            enum: ['technical', 'creative', 'casual', 'educational', 'business']
          },
          summary: { type: Type.STRING },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              }
            }
          },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                count: { type: Type.NUMBER }
              }
            }
          },
          sentiment: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          },
          aiRecommendation: { type: Type.STRING },
          interactiveWidgets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['checklist', 'code-snippet', 'timeline'] },
                content: { 
                  type: Type.OBJECT,
                  description: "Dynamic content based on the widget type.",
                  properties: {
                    items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Used for checklist type" },
                    language: { type: Type.STRING, description: "Used for code-snippet type" },
                    code: { type: Type.STRING, description: "Used for code-snippet type" },
                    events: {
                      type: Type.ARRAY,
                      description: "Used for timeline type",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        required: ["title", "theme", "summary", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response text received from Gemini. Please ensure the content is accessible.");
  }

  const parsed = JSON.parse(response.text) as AnalysisResult;
  
  // Extract grounding sources from metadata if they exist
  const sources: AnalysisSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          title: chunk.web.title || "Web Source",
          uri: chunk.web.uri
        });
      }
    });
  }
  
  // Deduplicate sources
  parsed.sources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

  return parsed;
};

export const fetchContentFromUrl = async (url: string): Promise<string> => {
  const lowerUrl = url.toLowerCase();
  const isValid = lowerUrl.includes('chatgpt.com') || 
                  lowerUrl.includes('claude.ai') || 
                  lowerUrl.includes('gemini.google.com') || 
                  lowerUrl.includes('openai.com') ||
                  lowerUrl.includes('google.com/share');
  
  if (!isValid) {
    throw new Error("Please provide a valid AI chat share link.");
  }
  
  return ""; 
};
