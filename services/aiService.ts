
import { AnalysisResult, Language } from "../types";

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

export interface AIUserConfig {
  apiKey: string;
  provider: string;
}

export const analyzeHistoryMetaSummary = async (
  summaries: { title: string; theme: string; summary: string }[],
  language: Language,
  userConfig?: AIUserConfig
): Promise<MetaSummaryResult> => {
  const response = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summaries, language, userConfig }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result: MetaSummaryResult = await response.json();
  return result;
};

export const analyzeChatHistory = async (
  content: string, 
  language: Language,
  userConfig?: AIUserConfig
): Promise<AnalysisResult> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, language, userConfig }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result: AnalysisResult = await response.json();
  return result;
};
