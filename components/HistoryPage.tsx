import React, { useEffect, useState } from 'react';
import {
    Zap, Languages, ArrowLeft, Trash2, Eye, Calendar, Tag, FileText,
    Loader2, AlertCircle, LogOut, Clock, Sparkles, ChevronRight, Search, History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAnalysisHistory, deleteAnalysis, AnalysisRecord } from '../services/historyService';
import { Language, AnalysisResult } from '../types';
import AuraBackground from './AuraBackground';

const HISTORY_TRANSLATIONS = {
    en: {
        title: "MEMORY",
        subtitle: "CORRIDOR",
        pageTitle: "Memory Archives",
        pageDesc: "Review your past neural analyses and conversation insights.",
        empty: "No memories archived yet. Analyze a conversation to begin.",
        loading: "Retrieving memories...",
        error: "Failed to retrieve memories.",
        deleteConfirm: "Permanently erase this memory fragment?",
        deleted: "Memory erased.",
        viewDetail: "Re-enter this memory",
        backToAnalysis: "New Analysis",
        searchPlaceholder: "Search memories...",
        sort: "Sort",
        signOut: "Sign Out",
        theme: "Theme",
        created: "Archived",
        actions: "Actions",
        noResults: "No matching memories found.",
    },
    zh: {
        title: "记忆",
        subtitle: "回廊",
        pageTitle: "记忆档案",
        pageDesc: "回顾你过去的神经分析和对话洞察。",
        empty: "暂无归档记忆。分析一段对话以开始。",
        loading: "正在检索记忆...",
        error: "无法检索记忆。",
        deleteConfirm: "永久删除此记忆片段？",
        deleted: "记忆已擦除。",
        viewDetail: "重新进入该记忆",
        backToAnalysis: "新建分析",
        searchPlaceholder: "搜索记忆...",
        sort: "排序",
        signOut: "退出登录",
        theme: "主题",
        created: "归档时间",
        actions: "操作",
        noResults: "未找到匹配的记忆。",
    },
};

interface HistoryPageProps {
    language: Language;
    onToggleLanguage: () => void;
    onBack: () => void;
    onViewResult: (result: AnalysisResult, content: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ language, onToggleLanguage, onBack, onViewResult }) => {
    const { user, signOut } = useAuth();
    const [records, setRecords] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const t = HISTORY_TRANSLATIONS[language];

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

    const handleDelete = async (id: string) => {
        if (!window.confirm(t.deleteConfirm)) return;
        setDeletingId(id);
        const { error } = await deleteAnalysis(id);
        if (!error) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
        setDeletingId(null);
    };

    const handleView = (record: AnalysisRecord) => {
        onViewResult(record.full_result, record.content_snippet);
    };

    const filteredRecords = records.filter(r => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            r.title.toLowerCase().includes(term) ||
            r.summary.toLowerCase().includes(term) ||
            r.theme.toLowerCase().includes(term)
        );
    });

    const getThemeColor = (theme: string) => {
        switch (theme) {
            case 'technical': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
            case 'creative': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
            case 'casual': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            case 'educational': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
            case 'business': return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
            default: return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center font-sans relative overflow-x-hidden">
            <AuraBackground />

            {/* Header */}
            <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={onBack}>
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
                            <Zap className="text-white w-5 h-5 fill-current" />
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

            <main className="w-full max-w-7xl mx-auto px-4 py-12 relative z-10">
                {/* Page Title */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 hover:border-indigo-500/30 flex items-center justify-center transition-all hover:bg-zinc-800"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-400" />
                        </button>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter text-white flex items-center gap-4">
                                <History className="w-10 h-10 text-indigo-400" />
                                {t.pageTitle}
                            </h2>
                            <p className="text-zinc-500 mt-2 font-medium">{t.pageDesc}</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium text-zinc-300 placeholder:text-zinc-600 backdrop-blur-xl"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                        <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">{t.loading}</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-4 p-6 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 max-w-lg mx-auto">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <p className="font-bold">{error}</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                            <FileText className="w-10 h-10 text-zinc-700" />
                        </div>
                        <p className="text-zinc-600 font-bold text-lg">
                            {searchTerm ? t.noResults : t.empty}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={onBack}
                                className="mt-8 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-all active:scale-95 inline-flex items-center gap-3"
                            >
                                <Sparkles className="w-5 h-5" />
                                {t.backToAnalysis}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className="group bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 hover:border-indigo-500/20 transition-all shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
                            >
                                {/* Decorative gradient */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-colors" />

                                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getThemeColor(record.theme)}`}>
                                                {record.theme}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-zinc-600 text-xs font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDate(record.created_at)}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight mb-3 truncate group-hover:text-indigo-300 transition-colors">
                                            {record.title}
                                        </h3>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2">
                                            {record.summary}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() => handleView(record)}
                                            className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                            {t.viewDetail}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            disabled={deletingId === record.id}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 border border-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === record.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;
