import React, { useEffect, useState, useMemo } from 'react';
import {
    Languages, ArrowLeft, Loader2, AlertCircle, LogOut, Sparkles,
    History, Brain, TrendingUp, Lightbulb, Target, BarChart3, RefreshCw
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getAnalysisHistory, AnalysisRecord } from '../services/historyService';
import { analyzeHistoryMetaSummary, MetaSummaryResult } from '../services/geminiService';
import { Language, TopicData, SentimentData, THEME_TRANSLATIONS } from '../types';
import { TopicCloud, SentimentRing } from './Visualization';
import AuraBackground from './AuraBackground';
import logoImg from '../picture/logo.jpg';

const TRANSLATIONS = {
    en: {
        title: "MEMORY",
        subtitle: "CORRIDOR",
        pageTitle: "Historical Summary",
        pageDesc: "A comprehensive analysis across all your memory archives.",
        loading: "Synthesizing memory archives...",
        aiLoading: "AI is analyzing your history...",
        error: "Failed to load archives.",
        empty: "No analyzed archives yet. Analyze some conversations first.",
        back: "Back to Archives",
        signOut: "Sign Out",
        totalArchives: "Total Archives",
        themeDistribution: "Theme Distribution",
        aggregatedTopics: "Aggregated Topic Cloud",
        aggregatedSentiment: "Overall Sentiment",
        aiSummary: "AI Meta-Summary",
        keyInsights: "Key Insights",
        patterns: "Interaction Patterns",
        recommendations: "Recommendations",
        generateSummary: "Generate AI Summary",
        regenerate: "Regenerate",
        mostCommonTheme: "Dominant Theme",
        uniqueThemes: "Unique Themes",
        topicsCovered: "Topics Covered",
        themeRadar: "Theme Radar",
        generateSummaryPrompt: "Click the button above to generate a cross-archive AI meta-analysis",
    },
    zh: {
        title: "记忆",
        subtitle: "回廊",
        pageTitle: "历史总结",
        pageDesc: "对你所有记忆档案的综合分析。",
        loading: "正在合成记忆档案...",
        aiLoading: "AI 正在分析你的历史...",
        error: "加载档案失败。",
        empty: "暂无已分析的档案。请先分析一些对话。",
        back: "返回档案",
        signOut: "退出登录",
        totalArchives: "档案总数",
        themeDistribution: "主题分布",
        aggregatedTopics: "聚合主题词云",
        aggregatedSentiment: "整体情感分析",
        aiSummary: "AI 元总结",
        keyInsights: "关键洞察",
        patterns: "交互模式",
        recommendations: "建议",
        generateSummary: "生成 AI 总结",
        regenerate: "重新生成",
        mostCommonTheme: "主导主题",
        uniqueThemes: "独特主题数",
        topicsCovered: "涵盖话题数",
        themeRadar: "主题雷达",
        generateSummaryPrompt: "点击上方按钮生成跨档案的 AI 元分析",
    },
};

const THEME_COLORS: Record<string, string> = {
    technical: '#3b82f6',
    creative: '#a855f7',
    casual: '#10b981',
    educational: '#f59e0b',
    business: '#71717a',
    analytical: '#14b8a6',
    philosophical: '#d946ef',
    emotional: '#ec4899',
    entertainment: '#06b6d4',
    planning: '#f97316',
    coding: '#0ea5e9',
    brainstorming: '#eab308',
    storytelling: '#8b5cf6',
    troubleshooting: '#ef4444',
    debate: '#f43f5e',
    advice: '#84cc16',
    roleplay: '#6366f1',
    productivity: '#10b981',
    other: '#a1a1aa',
};

const PIE_COLORS = [
    '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981',
    '#f59e0b', '#06b6d4', '#0ea5e9', '#8b5cf6', '#ef4444',
    '#f97316', '#84cc16', '#14b8a6', '#d946ef', '#eab308',
    '#71717a', '#f472b6', '#22d3ee', '#a3e635',
];

interface HistorySummaryPageProps {
    language: Language;
    onToggleLanguage: () => void;
    onBack: () => void;
}

const HistorySummaryPage: React.FC<HistorySummaryPageProps> = ({ language, onToggleLanguage, onBack }) => {
    const { user, signOut } = useAuth();
    const [records, setRecords] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metaSummary, setMetaSummary] = useState<MetaSummaryResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const t = TRANSLATIONS[language];
    
    const locMeta = metaSummary 
        ? (metaSummary[language] ? { ...metaSummary, ...metaSummary[language] } : metaSummary) 
        : null;

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        const { data, error } = await getAnalysisHistory(user.id);
        if (error) {
            setError(t.error);
        } else {
            setRecords(data || []);
        }
        setLoading(false);
    };

    // Aggregate theme distribution
    const themeDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        records.forEach(r => {
            counts[r.theme] = (counts[r.theme] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([theme, count]) => ({ theme, translatedTheme: THEME_TRANSLATIONS[language][theme] || theme, count }))
            .sort((a, b) => b.count - a.count);
    }, [records, language]);

    // Aggregate all topics across all archives
    const aggregatedTopics = useMemo(() => {
        const topicMap: Record<string, number> = {};
        records.forEach(r => {
            const locTopics = r.full_result?.[language]?.topics || r.full_result?.topics;
            if (locTopics) {
                locTopics.forEach((topic: TopicData) => {
                    topicMap[topic.name] = (topicMap[topic.name] || 0) + topic.count;
                });
            }
        });
        return Object.entries(topicMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 30) as TopicData[];
    }, [records, language]);

    // Aggregate sentiment data across all archives
    const aggregatedSentiment = useMemo(() => {
        const sentimentMap: Record<string, number> = {};
        let archiveCount = 0;
        records.forEach(r => {
            const locSentiment = r.full_result?.[language]?.sentiment || r.full_result?.sentiment;
            if (locSentiment) {
                archiveCount++;
                locSentiment.forEach((s: SentimentData) => {
                    sentimentMap[s.name] = (sentimentMap[s.name] || 0) + s.value;
                });
            }
        });
        if (archiveCount === 0) return [];
        return Object.entries(sentimentMap)
            .map(([name, value]) => ({ name, value: Math.round(value / archiveCount) })) as SentimentData[];
    }, [records, language]);

    // Stats
    const stats = useMemo(() => {
        const mostCommonTheme = themeDistribution.length > 0 ? themeDistribution[0].theme : '-';
        const uniqueThemes = themeDistribution.length;
        const totalTopics = aggregatedTopics.length;
        return { mostCommonTheme, uniqueThemes, totalTopics };
    }, [themeDistribution, aggregatedTopics]);

    // Generate AI summary
    const handleGenerateSummary = async () => {
        if (records.length === 0) return;
        setAiLoading(true);
        setAiError(null);
        try {
            const summaries = records.map(r => {
                const loc = r.full_result?.[language];
                return {
                    title: loc?.title || r.title,
                    theme: r.theme,
                    summary: loc?.summary || r.summary,
                };
            });
            const result = await analyzeHistoryMetaSummary(summaries, language);
            setMetaSummary(result);
        } catch (err: any) {
            setAiError(err.message || 'Failed to generate summary');
        } finally {
            setAiLoading(false);
        }
    };

    // Radar data for theme distribution
    const radarData = useMemo(() => {
        return themeDistribution.slice(0, 8).map(item => ({
            subject: item.translatedTheme,
            value: item.count,
            fullMark: Math.max(...themeDistribution.map(d => d.count)),
        }));
    }, [themeDistribution]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans relative">
                <AuraBackground />
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-6" />
                <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">{t.loading}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans relative">
                <AuraBackground />
                <div className="flex items-center gap-4 p-6 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 max-w-lg">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="font-bold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center font-sans relative overflow-x-hidden">
            <AuraBackground />

            {/* Header */}
            <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={onBack}>
                        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                            <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase">
                            {t.title} <span className="text-indigo-400">{t.subtitle}</span>
                        </h1>
                    </div>
                    <nav className="flex items-center gap-3">
                        <button
                            onClick={onToggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400"
                        >
                            <Languages className="w-4 h-4" />
                            {language === 'en' ? 'EN' : 'ZH'}
                        </button>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-rose-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-rose-400"
                        >
                            <LogOut className="w-4 h-4" />
                            {t.signOut}
                        </button>
                    </nav>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-4 py-12 relative z-10 flex flex-col gap-12">
                {/* Page Title */}
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 hover:border-indigo-500/30 flex items-center justify-center transition-all hover:bg-zinc-800"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </button>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter text-white flex items-center gap-4">
                                <Brain className="w-10 h-10 text-indigo-400" />
                                {t.pageTitle}
                            </h2>
                            <p className="text-zinc-500 mt-2 font-medium">{t.pageDesc}</p>
                        </div>
                    </div>
                </div>

                {records.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                            <History className="w-10 h-10 text-zinc-700" />
                        </div>
                        <p className="text-zinc-600 font-bold text-lg">{t.empty}</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all group">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-hover:text-indigo-400 transition-colors">{t.totalArchives}</div>
                                <div className="text-5xl font-black text-white group-hover:scale-105 transition-transform origin-left">{records.length}</div>
                            </div>
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all group">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-hover:text-indigo-400 transition-colors">{t.mostCommonTheme}</div>
                                <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left capitalize">{THEME_TRANSLATIONS[language][stats.mostCommonTheme] || stats.mostCommonTheme}</div>
                            </div>
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all group">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-hover:text-indigo-400 transition-colors">{t.uniqueThemes}</div>
                                <div className="text-5xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.uniqueThemes}</div>
                            </div>
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all group">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-hover:text-indigo-400 transition-colors">{t.topicsCovered}</div>
                                <div className="text-5xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.totalTopics}</div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Theme Distribution - Bar Chart */}
                            <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                        <BarChart3 className="w-7 h-7 text-indigo-400" />
                                    </div>
                                    <h4 className="font-black text-white text-2xl tracking-tight uppercase">{t.themeDistribution}</h4>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={themeDistribution} layout="vertical" margin={{ left: 20, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 700 }} />
                                            <YAxis
                                                type="category"
                                                dataKey="translatedTheme"
                                                tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }}
                                                width={100}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Bar dataKey="count" name={t.totalArchives} radius={[0, 8, 8, 0]}>
                                                {themeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={THEME_COLORS[entry.theme] || PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Theme Distribution - Pie Chart */}
                            <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                        <TrendingUp className="w-7 h-7 text-purple-400" />
                                    </div>
                                    <h4 className="font-black text-white text-2xl tracking-tight uppercase">{t.themeDistribution}</h4>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={themeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="count"
                                                nameKey="translatedTheme"
                                                stroke="none"
                                            >
                                                {themeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={THEME_COLORS[entry.theme] || PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                formatter={(value) => <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Aggregated Topic Cloud */}
                        {aggregatedTopics.length > 0 && (
                            <div className="bg-zinc-900/50 rounded-[3.5rem] shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden min-h-[550px] flex flex-col">
                                <div className="absolute top-6 left-8 z-20 flex items-center gap-3 px-4 py-2 bg-zinc-950/70 backdrop-blur-md rounded-2xl border border-white/10">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    <span className="font-black text-white text-sm tracking-tight uppercase">{t.aggregatedTopics}</span>
                                </div>
                                <div className="flex-1 p-4">
                                    <TopicCloud data={aggregatedTopics} />
                                </div>
                            </div>
                        )}

                        {/* Aggregated Sentiment + Radar */}
                        <div className="grid lg:grid-cols-2 gap-12">
                            {aggregatedSentiment.length > 0 && (
                                <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 shadow-2xl border border-white/5 backdrop-blur-xl">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                            <Target className="w-7 h-7 text-emerald-400" />
                                        </div>
                                        <h4 className="font-black text-white text-2xl tracking-tight uppercase">{t.aggregatedSentiment}</h4>
                                    </div>
                                    <div className="h-44">
                                        <SentimentRing data={aggregatedSentiment} />
                                    </div>
                                </div>
                            )}

                            {radarData.length > 0 && (
                                <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 shadow-2xl border border-white/5 backdrop-blur-xl">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                                            <BarChart3 className="w-7 h-7 text-cyan-400" />
                                        </div>
                                        <h4 className="font-black text-white text-2xl tracking-tight uppercase">
                                            {t.themeRadar}
                                        </h4>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="#3f3f46" />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }}
                                                />
                                                <PolarRadiusAxis tick={{ fill: '#52525b', fontSize: 10 }} />
                                                <Radar
                                                    name={t.totalArchives}
                                                    dataKey="value"
                                                    stroke="#6366f1"
                                                    fill="#6366f1"
                                                    fillOpacity={0.3}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Meta-Summary Section */}
                        <div className="bg-gradient-to-br from-zinc-900/70 via-zinc-900/50 to-indigo-950/30 rounded-[3.5rem] p-12 md:p-16 shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                            <Brain className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase">{t.aiSummary}</h3>
                                    </div>
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={aiLoading}
                                        className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-indigo-500 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-95 shadow-lg"
                                    >
                                        {aiLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t.aiLoading}
                                            </>
                                        ) : metaSummary ? (
                                            <>
                                                <RefreshCw className="w-5 h-5" />
                                                {t.regenerate}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                {t.generateSummary}
                                            </>
                                        )}
                                    </button>
                                </div>

                                {aiError && (
                                    <div className="flex items-center gap-4 p-6 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 mb-8">
                                        <AlertCircle className="w-6 h-6 shrink-0" />
                                        <p className="font-bold">{aiError}</p>
                                    </div>
                                )}

                                {!metaSummary && !aiLoading && (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                                            <Sparkles className="w-8 h-8 text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-600 font-bold">
                                            {t.generateSummaryPrompt}
                                        </p>
                                    </div>
                                )}

                                {locMeta && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                                        {/* Overall Summary */}
                                        <div className="bg-zinc-950/50 rounded-[2.5rem] p-10 border border-white/5">
                                            <p className="text-zinc-300 leading-relaxed text-lg font-medium whitespace-pre-line">
                                                {locMeta.overallSummary}
                                            </p>
                                        </div>

                                        {/* Key Insights */}
                                        <div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                    <Lightbulb className="w-6 h-6 text-amber-400" />
                                                </div>
                                                <h4 className="text-2xl font-black tracking-tighter text-white uppercase">{t.keyInsights}</h4>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {(locMeta.keyInsights || []).map((insight, i) => (
                                                    <div key={i} className="flex gap-4 bg-zinc-950/50 p-6 rounded-[2rem] border border-white/5 hover:border-amber-500/20 transition-all group">
                                                        <div className="shrink-0 w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-black group-hover:bg-amber-500/20 transition-all">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-zinc-400 font-medium leading-relaxed pt-1">{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Interaction Patterns */}
                                        <div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <h4 className="text-2xl font-black tracking-tighter text-white uppercase">{t.patterns}</h4>
                                            </div>
                                            <div className="space-y-4">
                                                {(locMeta.interactionPatterns || []).map((pattern, i) => (
                                                    <div key={i} className="flex items-start gap-4 bg-zinc-950/50 p-6 rounded-[2rem] border border-white/5 hover:border-cyan-500/20 transition-all">
                                                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2.5 shrink-0" />
                                                        <p className="text-zinc-400 font-medium leading-relaxed">{pattern}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recommendations */}
                                        <div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                                    <Target className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <h4 className="text-2xl font-black tracking-tighter text-white uppercase">{t.recommendations}</h4>
                                            </div>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {(locMeta.recommendations || []).map((rec, i) => (
                                                    <div key={i} className="bg-gradient-to-br from-zinc-950/60 to-indigo-950/20 p-6 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-black mb-4">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-zinc-400 font-medium leading-relaxed">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HistorySummaryPage;
