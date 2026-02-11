
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TopicData, SentimentData } from '../types';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'];

export const TopicCloud: React.FC<{ data: TopicData[] }> = ({ data }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={120} 
          tick={{ fontSize: 12, fill: '#a1a1aa', fontWeight: 'bold' }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          cursor={{ fill: '#3f3f46' }} 
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const SentimentRing: React.FC<{ data: SentimentData[] }> = ({ data }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={85}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          formatter={(value) => <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
