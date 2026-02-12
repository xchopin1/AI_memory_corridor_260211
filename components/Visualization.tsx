
import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip
} from 'recharts';
import { TopicData, SentimentData } from '../types';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'];

const WORD_CLOUD_COLORS = [
  '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb923c',
  '#34d399', '#22d3ee', '#facc15', '#60a5fa', '#f87171',
  '#2dd4bf', '#e879f9', '#a3e635', '#38bdf8', '#fb7185',
];

// Seeded PRNG for deterministic layout
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

interface CloudWord {
  text: string;
  count: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  opacity: number;
  x: number;
  y: number;
  rotation: number;
  id: string;
}

export const TopicCloud: React.FC<{ data: TopicData[] }> = ({ data }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cloudWords, setCloudWords] = useState<CloudWord[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Compute Layout
  React.useEffect(() => {
    if (!data || data.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const rand = seededRandom(42);
    const maxCount = Math.max(...data.map((d) => d.count));
    const minCount = Math.min(...data.map((d) => d.count));
    const countRange = maxCount - minCount || 1;

    // Font size scale - Discrete tiers as requested (54, 40, 26)
    const getFontSize = (count: number) => {
      const normalized = (count - minCount) / countRange;
      // Match the font weight thresholds (0.6 and 0.3)
      if (normalized > 0.6) return 54;
      if (normalized > 0.3) return 40;
      return 26;
    };

    const wordsForLayout = data.map((d) => ({
      text: d.name,
      size: getFontSize(d.count),
      count: d.count,
      data: d // keep original data ref
    }));

    // Dynamic import to avoid SSR issues if any, ensuring client-side execution
    import('d3-cloud').then((cloudModule) => {
      const cloud = cloudModule.default;

      // --- Shape convergence: shrink layout area to force tight packing ---
      // Using 85% width and 80% height pushes the archimedean spiral
      // to cluster words toward the centre, producing a smooth ellipse.
      const layoutW = dimensions.width * 0.85;
      const layoutH = dimensions.height * 0.80;

      const layout = cloud()
        .size([layoutW, layoutH])
        .words(wordsForLayout as any)

        // --- Dynamic padding: scale with font size ---
        // Large words  (54 px) → ~5 px padding
        // Medium words (40 px) → ~4 px padding
        // Small words  (26 px) → ~2 px padding
        .padding((d: any) => Math.max(2, Math.round(d.size / 10)))

        // --- Smart rotation: only short words may rotate ---
        // Words with ≥ 6 characters stay horizontal to prevent
        // jagged edges caused by long vertical words.
        // Short words have a 40 % chance of 90° rotation for variety.
        .rotate((d: any) => {
          if (d.text.length >= 6) return 0;      // long words → always horizontal
          return rand() > 0.6 ? 90 : 0;          // short words → 40 % vertical
        })

        .font('Inter, sans-serif')
        .spiral('archimedean')  // archimedean spiral → natural elliptical convergence

        // Keep original fontWeight logic
        .fontWeight((d: any) => {
          const normalized = (d.count - minCount) / countRange;
          return normalized > 0.6 ? 900 : normalized > 0.3 ? 700 : 600;
        })
        .fontSize((d: any) => d.size)
        .random(rand) // Seeded random for deterministic layout
        .on('end', (computedWords: any[]) => {
          let colorIdx = 0;

          const newWords = computedWords.map((w, i) => {
            const normalized = (w.count - minCount) / countRange;
            const opacity = 0.6 + normalized * 0.4;
            const color = WORD_CLOUD_COLORS[colorIdx % WORD_CLOUD_COLORS.length];
            colorIdx++;

            return {
              text: w.text,
              count: w.count,
              fontSize: w.size,
              color,
              // Retrieve the weight that d3-cloud actually used for bounding box
              fontWeight: w.weight,
              opacity,
              x: w.x + dimensions.width / 2,
              y: w.y + dimensions.height / 2,
              rotation: w.rotate,
              id: `${w.text}-${i}`,
            };
          });
          setCloudWords(newWords);
        });

      // Wait for web fonts to load before starting layout to ensure
      // accurate text measurements (avoids fallback font mismatch)
      if (document.fonts) {
        document.fonts.ready.then(() => {
          layout.start();
        });
      } else {
        layout.start();
      }
    });

  }, [data, dimensions]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-600 italic">
        No topic data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none" style={{ minHeight: '400px' }}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-purple-500/[0.03]" />

      {cloudWords.map((item) => (
        <div
          key={item.id}
          className="absolute transition-all duration-500 ease-out cursor-default"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${hoveredId === item.id ? 1.15 : 1})`,
            zIndex: hoveredId === item.id ? 50 : 10,
          }}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <span
            className="whitespace-nowrap transition-all duration-300 block"
            style={{
              fontSize: `${item.fontSize}px`,
              fontWeight: item.fontWeight,
              color: item.color,
              opacity: hoveredId !== null && hoveredId !== item.id ? 0.25 : item.opacity,
              textShadow: hoveredId === item.id
                ? `0 0 20px ${item.color}80, 0 0 40px ${item.color}40`
                : 'none',
              letterSpacing: item.fontSize > 36 ? '-0.02em' : '0.01em',
              lineHeight: 1,
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

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
