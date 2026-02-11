
export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type Language = 'en' | 'zh';

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

export interface AnalysisResult {
  title: string;
  theme: 'technical' | 'creative' | 'casual' | 'educational' | 'business';
  summary: string;
  keyTakeaways: string[];
  metrics: ChatMetric[];
  topics: TopicData[];
  sentiment: SentimentData[];
  aiRecommendation: string;
  sources: AnalysisSource[];
  rawContextSnippet: string;
  interactiveWidgets: {
    type: 'checklist' | 'code-snippet' | 'timeline';
    content: any;
  }[];
}

export interface AppState {
  content: string;
  status: AnalysisStatus;
  error: string | null;
  result: AnalysisResult | null;
  language: Language;
}
