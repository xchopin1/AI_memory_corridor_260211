
import { AnalysisResult, AnalysisSource, Language } from "../types";

export interface LocalizedMetaSummaryResult {
  overallSummary: string;
  keyInsights: string[];
  topThemes: { theme: string; count: number }[];
  interactionPatterns: string[];
  recommendations: string[];
}

export interface MetaSummaryResult {
  en?: LocalizedMetaSummaryResult;
  zh?: LocalizedMetaSummaryResult;

  overallSummary?: string;
  keyInsights?: string[];
  topThemes?: { theme: string; count: number }[];
  interactionPatterns?: string[];
  recommendations?: string[];
}

export const analyzeHistoryMetaSummary = async (
  summaries: { title: string; theme: string; summary: string }[],
  language: Language
): Promise<MetaSummaryResult> => {
  const response = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summaries, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result: MetaSummaryResult = await response.json();
  return result;
};

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

