
import { AnalysisResult, AnalysisSource, Language } from "../types";

export const analyzeChatHistory = async (content: string, language: Language): Promise<AnalysisResult> => {
  // Call the serverless API route instead of using the Gemini SDK directly in the browser.
  // This avoids the "An API Key must be set when running in a browser" error.
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result: AnalysisResult = await response.json();
  return result;
};

