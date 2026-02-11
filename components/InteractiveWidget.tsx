
import React from 'react';

interface WidgetProps {
  type: 'checklist' | 'code-snippet' | 'timeline';
  content: any;
}

export const InteractiveWidget: React.FC<WidgetProps> = ({ type, content }) => {
  switch (type) {
    case 'checklist':
      return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-700 mb-3">AI Generated Checklist</h4>
          <ul className="space-y-2">
            {(content.items || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'code-snippet':
      return (
        <div className="bg-slate-900 p-4 rounded-xl shadow-inner font-mono text-xs overflow-x-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">{content.language || 'javascript'}</span>
            <button className="text-indigo-400 hover:text-indigo-300">Copy</button>
          </div>
          <pre className="text-indigo-300">
            <code>{content.code}</code>
          </pre>
        </div>
      );
    case 'timeline':
      return (
        <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
          {(content.events || []).map((event: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white" />
              <div className="text-xs font-semibold text-indigo-600 mb-1">{event.time || `Phase ${i+1}`}</div>
              <p className="text-sm text-slate-700 font-medium">{event.title}</p>
              <p className="text-xs text-slate-500">{event.description}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
};
