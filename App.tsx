
import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud, PieChart as PieIcon, Lightbulb,
  Loader2, Link2, AlertCircle, Sparkles,
  MessageSquare, Layout, CheckCircle2, Send, Bot, User, Globe, ExternalLink, ShieldCheck, Zap, Languages, Upload, FileText, Trash2
} from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppState, AnalysisStatus, Language } from './types';
import { analyzeChatHistory } from './services/geminiService';
import { TopicCloud, SentimentRing } from './components/Visualization';
import { InteractiveWidget } from './components/InteractiveWidget';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// PDF worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

const TRANSLATIONS = {
  en: {
    title: "MEMORY",
    subtitle: "CORRIDOR",
    neuralLink: "NEURAL LINK ACTIVE",
    grounding: "Digital Consciousness Grounding",
    heroTitle: ["Your own", "AI Memory Corridor"],
    heroDesc: "Step into the echoes of your past interactions. Reconstruct meaning from uploaded fragments.",
    echoLabel: "Neural Fragments (Files & Text)",
    echoPlaceholder: "Paste conversation fragments or drop files here...",
    uploadLabel: "Neural Anchor (Drop PDF, Word, MD, JSON, TXT)",
    enterBtn: "Enter the Corridor",
    errorPathway: "Please provide neural fragments (Files or Text).",
    errorBlock: "The corridor is blocked. Please check your connection.",
    loadingMessages: [
      "Walking the memory corridor...",
      "Illuminating dialogue fragments...",
      "Reconstructing digital echoes...",
      "Verifying context integrity...",
      "Finalizing neural insights..."
    ],
    groundingVerified: "Neural Grounding Verified",
    integrity: "Memory Integrity",
    highlights: "Highlights",
    topicIntensity: "Topic Cloud",
    groundingEchoes: "Digital Footprints",
    selfContained: "Self-Contained Reality",
    toneSpectrum: "Tone Spectrum",
    guideTitle: "Corridor Guide",
    guideSubtitle: "Neural Resonance Protocol",
    questionPast: "Question the Past",
    chatDesc: "Gemini Pro is standing by. Ask about nuances, themes, or hidden details within this specific memory slice.",
    chatPlaceholder: "Query the corridor context...",
    footerSystems: "Neural Resonance Systems",
    footerCopy: "THE CORRIDOR IS ETERNAL.",
    fileAdded: "File digitized: ",
    parsingFile: "Decoding data stream...",
    unsupportedFile: "Format unsupported in this dimension.",
    // Added missing translation keys for the chatbot
    aiEchoFade: "The echo has faded into silence.",
    aiEchoError: "The corridor resonance is unstable. Please try again."
  },
  zh: {
    title: "记忆",
    subtitle: "回廊",
    neuralLink: "神经链路已激活",
    grounding: "数字意识锚定",
    heroTitle: ["你的专属", "AI 记忆回廊"],
    heroDesc: "步入过往互动的回响。我们从上传的片段中重构意义。",
    echoLabel: "神经片段 (文件与文本)",
    echoPlaceholder: "粘贴对话片段或在此处放逐文件...",
    uploadLabel: "神经锚点 (支持 PDF, Word, MD, JSON, TXT)",
    enterBtn: "进入回廊",
    errorPathway: "请提供神经片段（文件或文本）。",
    errorBlock: "回廊受阻。请检查您的连接。",
    loadingMessages: [
      "正在漫步记忆回廊...",
      "照亮对话片段...",
      "重构数字回响...",
      "验证上下文完整性...",
      "最终确定神经洞察..."
    ],
    groundingVerified: "神经锚定已验证",
    integrity: "记忆完整性",
    highlights: "精彩集锦",
    topicIntensity: "主题词云",
    groundingEchoes: "数字足迹",
    selfContained: "自洽现实",
    toneSpectrum: "语气光谱",
    guideTitle: "回廊向导",
    guideSubtitle: "神经共振协议",
    questionPast: "追问过去",
    chatDesc: "Gemini Pro 正在候命。询问有关此特定记忆切片的细微差别、主题或隐藏细节。",
    chatPlaceholder: "查询回廊上下文...",
    footerSystems: "神经共振系统",
    footerCopy: "回廊永恒。",
    fileAdded: "文件已数字化: ",
    parsingFile: "正在解构数据流...",
    unsupportedFile: "此维度不支持该格式。",
    // Added missing translation keys for the chatbot
    aiEchoFade: "回响已没入沉寂。",
    aiEchoError: "回廊共振不稳定，请重试。"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    content: '',
    status: AnalysisStatus.IDLE,
    error: null,
    result: null,
    language: 'zh'
  });

  const [isDragging, setIsDragging] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[state.language];

  useEffect(() => {
    let interval: number;
    if (state.status === AnalysisStatus.LOADING) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % t.loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [state.status, t.loadingMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    setState(prev => ({ ...prev, status: AnalysisStatus.LOADING, error: null }));

    try {
      let extractedText = "";
      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        extractedText = fullText;
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (['txt', 'md', 'json'].includes(extension || '')) {
        extractedText = await file.text();
      } else {
        throw new Error(t.unsupportedFile);
      }

      setState(prev => ({
        ...prev,
        content: prev.content + (prev.content ? "\n\n" : "") + extractedText,
        status: AnalysisStatus.IDLE
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message,
        status: AnalysisStatus.IDLE
      }));
    }
  };

  const handleAnalyze = async () => {
    if (!state.content.trim()) {
      setState(prev => ({ ...prev, error: t.errorPathway }));
      return;
    }

    setState(prev => ({ ...prev, status: AnalysisStatus.LOADING, error: null, result: null }));
    setChatHistory([]);

    try {
      const result = await analyzeChatHistory(state.content, state.language);
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.SUCCESS,
        result
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: err.message || t.errorBlock
      }));
    }
  };

  const toggleLanguage = () => {
    setState(prev => ({ ...prev, language: prev.language === 'en' ? 'zh' : 'en' }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chatModel = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are the guardian of the AI Memory Corridor (AI 记忆回廊). You have analyzed a document or chat history. 
          The summary is: ${state.result?.summary}. 
          The primary context provided was: ${state.content.substring(0, 2000)}...
          Respond in ${state.language === 'en' ? 'English' : 'Chinese (Simplified)'}.
          Answer questions about this specific conversation in a profound and helpful manner.`,
        },
      });

      const response: GenerateContentResponse = await chatModel.sendMessage({ message: userMessage });
      // Fixed property access errors by adding keys to TRANSLATIONS
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || t.aiEchoFade }]);
    } catch (err) {
      // Fixed property access errors by adding keys to TRANSLATIONS
      setChatHistory(prev => [...prev, { role: 'ai', text: t.aiEchoError }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'technical': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'creative': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'casual': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'educational': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'business': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 flex flex-col items-center font-sans relative overflow-x-hidden ${state.language === 'zh' ? 'tracking-normal' : ''}`}>
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">
              {t.title} <span className="text-indigo-400">{t.subtitle}</span>
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400"
            >
              <Languages className="w-4 h-4" />
              {state.language === 'en' ? 'EN' : 'ZH'}
            </button>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shadow-inner">
              AI
            </div>
          </nav>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-12 flex flex-col gap-12 relative z-10">
        {/* Input Section */}
        <section className={`transition-all duration-1000 ease-in-out origin-top ${state.status === AnalysisStatus.SUCCESS ? 'scale-90 opacity-40 h-0 overflow-hidden pointer-events-none' : 'scale-100 opacity-100'}`}>
          <div className="bg-zinc-900/40 rounded-[3rem] p-8 md:p-20 shadow-2xl border border-white/5 backdrop-blur-3xl relative overflow-hidden">

            <div className="max-w-3xl mx-auto text-center mb-16 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-500/20 shadow-sm">
                <Sparkles className="w-3 h-3" /> {t.grounding}
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                {t.heroTitle[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
                  {t.heroTitle[1]}
                </span>
              </h2>
              <p className="text-zinc-400 text-lg font-medium max-w-xl mx-auto">
                {t.heroDesc}
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
                className={`relative group h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] transition-all duration-500 ${isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                  : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700'
                  }`}
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.docx,.txt,.md,.json"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <div className="text-center p-8 pointer-events-none">
                  <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-transform ${isDragging ? 'scale-125 bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-indigo-400'}`}>
                    <Upload className="w-10 h-10" />
                  </div>
                  <p className="text-zinc-300 font-black tracking-tight mb-2 text-lg">{t.uploadLabel.split('(')[0]}</p>
                  <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">{t.uploadLabel.split('(')[1].replace(')', '')}</p>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="relative flex-1">
                  <textarea
                    placeholder={t.echoPlaceholder}
                    className="w-full h-full p-8 rounded-[2.5rem] bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base min-h-[300px] resize-none shadow-inner font-medium text-zinc-300 scrollbar-hide"
                    value={state.content}
                    onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                  />
                  {state.content && (
                    <button
                      onClick={() => setState(prev => ({ ...prev, content: '' }))}
                      className="absolute top-6 right-6 p-3 bg-zinc-900/50 hover:bg-rose-500/20 hover:text-rose-500 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto mt-12 relative z-10">
              <button
                onClick={handleAnalyze}
                disabled={state.status === AnalysisStatus.LOADING}
                className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 font-black py-7 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                {state.status === AnalysisStatus.LOADING ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin w-7 h-7 mb-3 text-indigo-600" />
                    <span className="text-[11px] animate-pulse font-black uppercase tracking-widest">{t.loadingMessages[loadingMessageIndex]}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span className="text-2xl tracking-tighter">{t.enterBtn}</span>
                  </>
                )}
              </button>

              {state.error && (
                <div className="mt-8 flex items-start gap-4 p-6 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 text-sm animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="shrink-0 w-6 h-6" />
                  <p className="font-bold leading-relaxed">{state.error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {state.status === AnalysisStatus.SUCCESS && state.result && (
          <div className="animate-in fade-in slide-in-from-bottom-20 duration-1000 flex flex-col gap-12 pb-48">

            {/* Context Verification Badge */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-[0_20px_60px_-15px_rgba(99,102,241,0.5)] flex flex-col md:flex-row items-center gap-8 border border-white/20">
              <div className="shrink-0 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <FileText className="w-9 h-9" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-indigo-200">{t.groundingVerified}</h4>
                <p className="text-lg font-bold italic leading-tight">
                  "{state.result.rawContextSnippet}"
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-black/20 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.integrity}: 100%
              </div>
            </div>

            {/* Main Insights Grid */}
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-zinc-900/50 rounded-[3.5rem] p-12 md:p-16 shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors" />

                <div className="mb-12 relative z-10">
                  <h3 className="text-5xl font-black text-white tracking-tighter leading-none mb-6">
                    {state.result.title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${getThemeColor(state.result.theme)} shadow-inner`}>
                      {state.result.theme}
                    </span>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed text-2xl mb-16 font-medium relative z-10">
                  {state.result.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                  {state.result.metrics.map((m, i) => (
                    <div key={i} className="bg-zinc-950/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all shadow-sm group/metric">
                      <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 group-hover/metric:text-indigo-400 transition-colors">{m.label}</div>
                      <div className="text-5xl font-black text-white group-hover/metric:scale-105 transition-transform origin-left">
                        {m.value}<span className="text-sm font-bold text-zinc-500 ml-2">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[3.5rem] p-12 md:p-16 shadow-2xl text-black relative overflow-hidden flex flex-col group">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center gap-4 mb-12 relative z-10">
                  <div className="p-4 bg-zinc-100 rounded-2xl">
                    <Lightbulb className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">{t.highlights}</h3>
                </div>
                <ul className="space-y-10 relative z-10 flex-1">
                  {state.result.keyTakeaways.map((item, i) => (
                    <li key={i} className="flex gap-6 text-lg text-zinc-800 leading-snug group/item">
                      <div className="shrink-0 w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-black group-hover/item:bg-indigo-600 transition-all group-hover/item:scale-110">
                        {i + 1}
                      </div>
                      <span className="font-bold pt-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Visuals Grid */}
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-zinc-900/50 rounded-[3.5rem] shadow-2xl border border-white/5 backdrop-blur-xl flex flex-col min-h-[550px] relative overflow-hidden">
                {/* Floating title badge */}
                <div className="absolute top-6 left-8 z-20 flex items-center gap-3 px-4 py-2 bg-zinc-950/70 backdrop-blur-md rounded-2xl border border-white/10">
                  <Cloud className="w-5 h-5 text-indigo-400" />
                  <span className="font-black text-white text-sm tracking-tight uppercase">{t.topicIntensity}</span>
                </div>
                {/* Word cloud fills entire area */}
                <div className="flex-1 p-4">
                  <TopicCloud data={state.result.topics} />
                </div>
              </div>

              <div className="flex flex-col gap-12">
                <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 md:p-16 shadow-2xl border border-white/5 backdrop-blur-xl flex-1">
                  <div className="flex items-center gap-5 mb-12">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <PieIcon className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h4 className="font-black text-white text-2xl tracking-tight uppercase">{t.toneSpectrum}</h4>
                  </div>
                  <div className="h-44">
                    <SentimentRing data={state.result.sentiment} />
                  </div>
                </div>

                <div className="bg-zinc-900/50 rounded-[3.5rem] p-12 md:p-16 shadow-2xl border border-white/5 backdrop-blur-xl flex-1 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-10 h-10 text-indigo-400 mb-6" />
                  <p className="text-zinc-400 font-bold max-w-xs">{state.result.aiRecommendation}</p>
                </div>
              </div>
            </div>

            {/* Interactive Widgets Section */}
            {state.result.interactiveWidgets && state.result.interactiveWidgets.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {state.result.interactiveWidgets.map((widget, i) => (
                  <InteractiveWidget key={i} type={widget.type} content={widget.content} language={state.language} />
                ))}
              </div>
            )}

            {/* Chatbot Interface */}
            <div className="mt-16 bg-zinc-900/60 rounded-[4rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[750px] relative backdrop-blur-2xl">
              <div className="px-12 py-10 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] rotate-6 group hover:rotate-0 transition-transform cursor-pointer">
                    <Bot className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-black text-3xl text-white tracking-tighter leading-none">{t.guideTitle}</h4>
                    <p className="text-[10px] text-indigo-400 font-black mt-3 uppercase tracking-[0.4em]">{t.guideSubtitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner border border-indigo-500/20">
                      <MessageSquare className="w-10 h-10 text-indigo-400/50" />
                    </div>
                    <h5 className="text-2xl font-black text-white mb-6 tracking-tight">{t.questionPast}</h5>
                    <p className="text-zinc-500 font-medium leading-relaxed text-lg">
                      {t.chatDesc}
                    </p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-400`}>
                    <div className={`flex gap-6 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 -rotate-3 border border-indigo-400' : 'bg-white rotate-3 border border-zinc-200'}`}>
                        {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-black" />}
                      </div>
                      <div className={`p-8 rounded-[2.5rem] text-lg leading-relaxed font-bold shadow-xl border ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-400'
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-none border-zinc-700'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="flex gap-5 items-center bg-zinc-800/50 px-8 py-5 rounded-[2rem] border border-white/5">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center animate-pulse">
                        <Bot className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-12 bg-zinc-950/60 border-t border-white/5 backdrop-blur-3xl">
                <form onSubmit={handleSendMessage} className="relative group max-w-5xl mx-auto">
                  <input
                    type="text"
                    placeholder={t.chatPlaceholder}
                    className="w-full pl-10 pr-20 py-8 rounded-[2.5rem] bg-zinc-900 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all shadow-2xl font-bold text-xl text-white placeholder:text-zinc-600"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatting}
                    className="absolute right-4 top-4 w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center hover:bg-indigo-500 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-700 shadow-2xl transition-all active:scale-90"
                  >
                    <Send className="w-7 h-7" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-24 px-4 text-center border-t border-white/5 bg-zinc-950/80 relative z-10 mt-20">
        <div className="max-w-xl mx-auto">
          <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-10 rounded-full" />
          <p className="font-black uppercase tracking-[0.6em] mb-8 text-[11px] text-zinc-500">{t.footerSystems}</p>
          <p className="text-[10px] font-black text-zinc-700 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} NEURAL INSIGHT LABS. {t.footerCopy}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
