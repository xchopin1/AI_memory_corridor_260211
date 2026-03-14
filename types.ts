
export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type Language = 'en' | 'zh';

export const THEME_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    technical: 'Technical',
    creative: 'Creative',
    casual: 'Casual',
    educational: 'Educational',
    business: 'Business',
    analytical: 'Analytical',
    philosophical: 'Philosophical',
    emotional: 'Emotional',
    entertainment: 'Entertainment',
    planning: 'Planning',
    coding: 'Coding',
    brainstorming: 'Brainstorming',
    storytelling: 'Storytelling',
    troubleshooting: 'Troubleshooting',
    debate: 'Debate',
    advice: 'Advice',
    roleplay: 'Roleplay',
    productivity: 'Productivity',
    other: 'Other'
  },
  zh: {
    technical: '技术探讨',
    creative: '创意表达',
    casual: '日常闲聊',
    educational: '教育学术',
    business: '商业职场',
    analytical: '分析研究',
    philosophical: '哲学思辨',
    emotional: '情感交流',
    entertainment: '娱乐资讯',
    planning: '计划安排',
    coding: '编程开发',
    brainstorming: '头脑风暴',
    storytelling: '故事叙述',
    troubleshooting: '问题排查',
    debate: '辩论探讨',
    advice: '建议指导',
    roleplay: '角色扮演',
    productivity: '效率工具',
    other: '其他'
  }
};

export interface ChatMetric {
  label: string;
  value: number;
  unit: string;
}

export interface TopicData {
  name: string;
  count: number;
}

export interface SentimentData {
  name: string;
  value: number;
}

export interface AnalysisSource {
  title: string;
  uri: string;
}

export interface LocalizedAnalysisResult {
  title: string;
  summary: string;
  rawContextSnippet: string;
  keyTakeaways: string[];
  metrics: ChatMetric[];
  topics: TopicData[];
  sentiment: SentimentData[];
  aiRecommendation: string;
  interactiveWidgets: {
    type: 'checklist' | 'code-snippet' | 'timeline';
    content: any;
  }[];
}

export interface AnalysisResult {
  title?: string;
  theme: 'technical' | 'creative' | 'casual' | 'educational' | 'business' | 'analytical' | 'philosophical' | 'emotional' | 'entertainment' | 'planning' | 'coding' | 'brainstorming' | 'storytelling' | 'troubleshooting' | 'debate' | 'advice' | 'roleplay' | 'productivity' | 'other';
  summary?: string;
  keyTakeaways?: string[];
  metrics?: ChatMetric[];
  topics?: TopicData[];
  sentiment?: SentimentData[];
  aiRecommendation?: string;
  sources?: AnalysisSource[];
  rawContextSnippet?: string;
  interactiveWidgets?: {
    type: 'checklist' | 'code-snippet' | 'timeline';
    content: any;
  }[];
  
  // Fully localized structures
  en?: LocalizedAnalysisResult;
  zh?: LocalizedAnalysisResult;
}

export interface AppState {
  content: string;
  status: AnalysisStatus;
  error: string | null;
  result: AnalysisResult | null;
  language: Language;
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'kimi' | 'grok';

export interface AIKeyConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  isActive: boolean;
  priority: number;
}

export interface AISettings {
  customKeys: AIKeyConfig[];
  useDefaultFallback: boolean;
  selectedKeyId: string | null; // null means use default
}
