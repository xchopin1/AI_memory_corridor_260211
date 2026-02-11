
import React from 'react';
import { Language } from '../types';

interface WidgetProps {
  type: 'checklist' | 'code-snippet' | 'timeline';
  content: any;
  language: Language;
}

export const InteractiveWidget: React.FC<WidgetProps> = ({ type, content, language }) => {
  if (!content) return null;

  const labels = {
    en: {
      checklist: "Neural Checklist",
      code: "fragment",
      copy: "COPY_DATA",
      time: "T+"
    },
    zh: {
      checklist: "神经核查清单",
      code: "片段",
      copy: "复制数据",
      time: "T+"
    }
  }[language];

  switch (type) {
    case 'checklist':
      return (
        <div className="bg-zinc-950/50 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
          <h4 className="font-black text-white text-sm uppercase tracking-widest mb-4">{labels.checklist}</h4>
          <ul className="space-y-3">
            {(content.items || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-4 group">
                <div className="relative mt-1">
                  <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-zinc-700 checked:bg-indigo-500 checked:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer" />
                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <span className="text-sm text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'code-snippet':
      return (
        <div className="bg-black p-6 rounded-3xl shadow-2xl border border-white/5 font-mono text-sm overflow-x-auto group">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
            <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">{content.language || 'javascript'} {labels.code}</span>
            <button className="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors">{labels.copy}</button>
          </div>
          <pre className="text-indigo-300/90 leading-relaxed">
            <code>{content.code}</code>
          </pre>
        </div>
      );
    case 'timeline':
      return (
        <div className="relative pl-8 border-l-2 border-zinc-800 space-y-10 py-2">
          {(content.events || []).map((event: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] border-4 border-zinc-950" />
              <div className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-[0.2em]">{event.time || `${labels.time}${i}`}</div>
              <p className="text-lg text-white font-black tracking-tight leading-none mb-2">{event.title}</p>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">{event.description}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
};
