
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart2, PieChart as PieIcon, Lightbulb, 
  ArrowRight, Loader2, Link2, AlertCircle, Sparkles,
  MessageSquare, Layout, CheckCircle2, Send, Bot, User, Globe, ExternalLink
} from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppState, AnalysisStatus } from './types';
import { analyzeChatHistory, fetchContentFromUrl } from './services/geminiService';
import { TopicCloud, SentimentRing } from './components/Visualization';
import { InteractiveWidget } from './components/InteractiveWidget';

const LOADING_MESSAGES = [
  "Bypassing hardcoded mocks...",
  "Querying real-time intelligence...",
  "Extracting grounding sources...",
  "Analyzing your specific dialogue...",
  "Structuring deep insights...",
  "Finalizing personalized dashboard..."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    url: '',
    content: '',
    status: AnalysisStatus.IDLE,
    error: null,
    result: null,
  });

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: number;
    if (state.status === AnalysisStatus.LOADING) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAnalyze = async () => {
    if (!state.url && !state.content) {
      setState(prev => ({ ...prev, error: "Please enter a URL or paste chat content." }));
      return;
    }

    setState(prev => ({ ...prev, status: AnalysisStatus.LOADING, error: null, result: null }));
    setChatHistory([]);

    try {
      // If we only have a URL, we pass that to the analyze service which uses grounding
      const result = await analyzeChatHistory(state.content, state.url);
      
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.SUCCESS,
        result,
        // Keep the content or indicate it's from search
        content: state.content || `Analysis grounded by URL: ${state.url}`
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: err.message || "An unexpected error occurred during analysis."
      }));
    }
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
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are an expert analyst. You have analyzed a chat history. 
          The summary is: ${state.result?.summary}. 
          The primary context provided was: ${state.content}.
          Answer questions about this specific conversation in a helpful and concise manner.`,
        },
      });

      const response: GenerateContentResponse = await chatModel.sendMessage({ message: userMessage });
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "I couldn't process that request." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error while responding." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'technical': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'creative': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'casual': return 'bg-green-50 text-green-700 border-green-200';
      case 'educational': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'business': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 flex flex-col items-center font-sans">
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Insight Pro
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <span className="hidden md:inline text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded tracking-widest uppercase">REAL-TIME ENGINE</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white">
              AI
            </div>
          </nav>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Input Section */}
        <section className={`transition-all duration-700 ease-in-out origin-top ${state.status === AnalysisStatus.SUCCESS ? 'scale-95 opacity-80 h-auto' : 'scale-100 opacity-100'}`}>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-indigo-100/50 border border-slate-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-50 rounded-full blur-[80px] opacity-60" />
            
            <div className="max-w-3xl mx-auto text-center mb-12 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-indigo-100 shadow-sm">
                <Sparkles className="w-3 h-3" /> Live Gemini Analysis
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                No more mocks. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Deep Context Analysis.</span>
              </h2>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 inline-block">
                <p className="text-amber-800 text-sm font-medium">
                  <span className="font-bold">Tip:</span> Direct pasting of dialogue text ensures the most accurate analysis if share links are restricted.
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Grounding Link (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Link2 className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Paste share URL (Gemini, ChatGPT, etc.)"
                    className="w-full pl-14 pr-4 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50/50 outline-none transition-all text-lg placeholder:text-slate-300 shadow-sm font-medium"
                    value={state.url}
                    onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 text-slate-300 py-2">
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">AND / OR PASTE CONTENT</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Conversation Text</label>
                <textarea
                  placeholder="Paste the actual chat text here for 100% accuracy..."
                  className="w-full p-6 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50/50 outline-none transition-all text-base min-h-[160px] resize-none shadow-sm font-medium"
                  value={state.content}
                  onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={state.status === AnalysisStatus.LOADING}
                className="mt-4 w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-6 rounded-3xl shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
              >
                {state.status === AnalysisStatus.LOADING ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin w-6 h-6 mb-2" />
                    <span className="text-[10px] animate-pulse font-black uppercase tracking-widest">{LOADING_MESSAGES[loadingMessageIndex]}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:scale-125 transition-transform text-amber-300" />
                    <span className="text-xl tracking-tight">Run Real-time Analysis</span>
                  </>
                )}
              </button>
              
              {state.error && (
                <div className="flex items-start gap-4 p-5 bg-rose-50 text-rose-700 rounded-3xl border border-rose-100 text-sm animate-in fade-in zoom-in duration-300 shadow-sm">
                  <AlertCircle className="shrink-0 w-6 h-6 text-rose-500" />
                  <p className="font-bold leading-relaxed">{state.error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {state.status === AnalysisStatus.SUCCESS && state.result && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 flex flex-col gap-10 pb-40">
            
            {/* Summary Block */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-[60px] -mr-20 -mt-20" />
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10 relative z-10">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-4">
                      {state.result.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getThemeColor(state.result.theme)}`}>
                        {state.result.theme}
                      </span>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> LIVE DATA ANALYSIS
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-600 leading-relaxed text-xl mb-12 font-medium relative z-10">
                  {state.result.summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 relative z-10">
                  {state.result.metrics.map((m, i) => (
                    <div key={i} className="group bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-400 transition-colors">{m.label}</div>
                      <div className="text-4xl font-black text-indigo-600 group-hover:scale-105 transition-transform origin-left">
                        {m.value}<span className="text-sm font-bold text-slate-300 ml-1.5">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl text-white relative overflow-hidden group flex flex-col">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px] group-hover:bg-indigo-600/30 transition-colors" />
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="p-3 bg-white/10 rounded-2xl shadow-inner">
                    <Lightbulb className="w-7 h-7 text-amber-300" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Key Insights</h3>
                </div>
                <ul className="space-y-8 relative z-10 flex-1">
                  {state.result.keyTakeaways.map((item, i) => (
                    <li key={i} className="flex gap-5 text-base md:text-lg text-slate-300 leading-relaxed group/item">
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover/item:bg-indigo-600 group-hover/item:border-indigo-400 transition-all group-hover/item:scale-110">
                        {i + 1}
                      </div>
                      <span className="group-hover/item:text-white transition-colors pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Visuals & Sources */}
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100 flex flex-col min-h-[450px]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                    <BarChart2 className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase">Extracted Topics</h4>
                </div>
                <div className="flex-1">
                  <TopicCloud data={state.result.topics} />
                </div>
              </div>
              
              <div className="flex flex-col gap-10">
                <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100 flex-1">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                      <Globe className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase">Grounding Sources</h4>
                  </div>
                  <div className="space-y-4">
                    {state.result.sources && state.result.sources.length > 0 ? (
                      state.result.sources.map((src, i) => (
                        <a 
                          key={i} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-white transition-all group"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-700">{src.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{src.uri}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-slate-400 text-sm font-medium">No external grounding required. <br/>Analysis based strictly on pasted content.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100 flex-1">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                      <PieIcon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase">Tone Profile</h4>
                  </div>
                  <div className="h-40">
                    <SentimentRing data={state.result.sentiment} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Strategy */}
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-[80px]" />
                <h4 className="font-black text-xl mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <Sparkles className="w-6 h-6 text-indigo-200" />
                  Strategy Advice
                </h4>
                <p className="text-xl text-indigo-50 leading-relaxed font-bold italic mb-8 relative z-10">
                  &ldquo;{state.result.aiRecommendation}&rdquo;
                </p>
              </div>
              
              <div className="lg:col-span-2 space-y-8">
                <h4 className="font-black text-slate-800 flex items-center gap-4 px-4 uppercase tracking-[0.2em] text-[10px]">
                  <Layout className="w-5 h-5 text-indigo-500" />
                  Dynamic Content Modules
                </h4>
                <div className="grid sm:grid-cols-2 gap-8">
                  {state.result.interactiveWidgets?.map((widget, i) => (
                    <InteractiveWidget key={i} type={widget.type} content={widget.content} />
                  ))}
                </div>
              </div>
            </div>

            {/* Chatbot Interface */}
            <div className="mt-12 bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col h-[700px] relative">
              <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl rotate-3">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-slate-900 tracking-tighter leading-none">Insight Chat</h4>
                    <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.3em]">Query this session</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                      <Bot className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h5 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Ask questions about the dialogue.</h5>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      Gemini is now using your actual chat context. Try asking something specific to your input!
                    </p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
                    <div className={`flex gap-5 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 -rotate-3' : 'bg-slate-900 rotate-3'}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                      </div>
                      <div className={`p-6 rounded-[2rem] text-base leading-relaxed font-medium shadow-sm border ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500' 
                          : 'bg-white text-slate-700 rounded-tl-none border-slate-100'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 items-center bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center animate-pulse">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-10 bg-slate-50/50 border-t border-slate-100 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="relative group max-w-4xl mx-auto">
                  <input
                    type="text"
                    placeholder="Ask a question about the session insights..."
                    className="w-full pl-8 pr-16 py-6 rounded-[2rem] border-2 border-slate-200 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-100/50 outline-none transition-all shadow-lg font-bold text-lg"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatting}
                    className="absolute right-3 top-3 w-14 h-14 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-200 shadow-xl shadow-indigo-100 transition-all active:scale-90"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-20 px-4 text-center text-slate-400 border-t border-slate-100 bg-white relative z-10">
        <p className="font-black uppercase tracking-[0.5em] mb-6 text-[10px] text-slate-300">Insight Pro Protocol</p>
        <p className="text-[10px] font-bold text-slate-300">© {new Date().getFullYear()} NEURAL INSIGHT LABS. REAL CONTEXT DEPLOYED.</p>
      </footer>
    </div>
  );
};

export default App;
