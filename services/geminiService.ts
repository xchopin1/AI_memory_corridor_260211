
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisSource, Language } from "../types";

export const analyzeChatHistory = async (content: string, language: Language): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = "gemini-3-pro-preview";
  const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';

  const prompt = `CRITICAL INSTRUCTION: Analyze the provided conversation history/document content.
    OUTPUT LANGUAGE: All text fields in the JSON response MUST be in ${langName}.
    
    CONTENT TO ANALYZE:
    ${content}

    STRICT REQUIREMENTS:
    1. Identify the specific topics, speakers, and intent.
    2. Provide a 'rawContextSnippet' which is a precise description or 2-sentence quote from the source that defines the core of the discussion.
    3. Metrics should reflect the density of information or participation.
    4. interactiveWidgets should be used to provide helpful post-analysis tools like a summary checklist or a timeline of the conversation.
    
    Return the analysis in JSON format based on the defined schema. Ensure every string value is in ${langName}.`;
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
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
          rawContextSnippet: { type: Type.STRING },
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
                  properties: {
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    language: { type: Type.STRING },
                    code: { type: Type.STRING },
                    events: {
                      type: Type.ARRAY,
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
        required: ["title", "theme", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error(language === 'en' ? "No response text received." : "未收到响应文本。");
  }

  return JSON.parse(text) as AnalysisResult;
};
