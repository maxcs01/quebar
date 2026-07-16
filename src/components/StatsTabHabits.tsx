import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  Info, 
  Layers, 
  Flame, 
  CheckCircle,
  Award,
  Heart,
  TrendingUp,
  Activity
} from 'lucide-react';
import { DayProgress, Habit, UserProfile } from '../types';
import { getGeneralRadar } from '../utils/statsCalculator';

interface StatsTabHabitsProps {
  days: string[];
  historyFiltered: DayProgress[];
  habits: Habit[];
  profile: UserProfile;
}

// Map habit category to color palettes
const CATEGORY_COLORS: Record<string, { bg: string, border: string, text: string, name: string }> = {
  'spiritual': { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-400', name: 'Oração & Clamor' },
  'reading': { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-400', name: 'Estudo Bíblico' },
  'meditation': { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-400', name: 'Vigília & Presença' },
  'reflection': { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', name: 'Exame de Consciência' },
  'gratitude': { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-400', name: 'Ações de Graças' }
};

export default function StatsTabHabits({ days, historyFiltered, habits, profile }: StatsTabHabitsProps) {
  // Local navigation: 'habits' | 'donut' | 'radar'
  const [activeSubView, setActiveSubView] = useState<'habits' | 'donut' | 'radar'>('habits');

  // Process daily stacked habit completions
  const dailyStackedHabits = useMemo(() => {
    return days.map(dateStr => {
      const dayLog = historyFiltered.find(h => h.date === dateStr);
      const completedIds = dayLog?.habitsCompleted || [];

      // Categorize completions
      const categoriesCount: Record<string, number> = {
        spiritual: 0,
        reading: 0,
        meditation: 0,
        reflection: 0,
        gratitude: 0
      };

      completedIds.forEach(id => {
        const h = habits.find(hab => hab.id === id);
        const category = h?.category || 'spiritual';
        categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      });

      // Total completed on this day
      const totalDayCount = completedIds.length;

      // Label
      const dateParts = dateStr.split('-');
      const shortLabel = `${dateParts[2]}/${dateParts[1]}`;

      return {
        dateStr,
        label: shortLabel,
        counts: categoriesCount,
        totalDayCount
      };
    });
  }, [days, historyFiltered, habits]);

  // Max total completions on a single day for coordinate ceiling
  const maxDayCompletions = useMemo(() => {
    const counts = dailyStackedHabits.map(h => h.totalDayCount);
    return Math.max(...counts, habits.length || 5);
  }, [dailyStackedHabits, habits]);

  // Time dedication distribution for Donut Chart
  const donutData = useMemo(() => {
    let prayerSecs = 0;
    let readingSecs = 0;
    let diarySecs = 0;
    let othersSecs = 0;

    historyFiltered.forEach(day => {
      // Estimate journal time based on daily reflection text
      if (day.reflection && day.reflection.trim().length > 0) {
        diarySecs += 180; // 3 min per reflection entry
      }

      // Sessions check
      if (day.sessions && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          if (s.tag === 'leitura') {
            readingSecs += s.durationSeconds;
          } else {
            // Other tags are: 'despertar' | 'manha' | 'noite' | 'aleatorio'
            prayerSecs += s.durationSeconds;
          }
        });
      } else {
        prayerSecs += day.meditationSeconds || 0;
        // Estimate others based on habits completed
        const completedCount = day.habitsCompleted?.length || 0;
        othersSecs += completedCount * 120; // 2 min per habit
      }
    });

    const totalSecs = prayerSecs + readingSecs + diarySecs + othersSecs || 1;
    const prayerMin = Math.round(prayerSecs / 60);
    const readingMin = Math.round(readingSecs / 60);
    const diaryMin = Math.round(diarySecs / 60);
    const othersMin = Math.round(othersSecs / 60);
    const totalMin = prayerMin + readingMin + diaryMin + othersMin;

    const prayerPercent = Math.round((prayerSecs / totalSecs) * 100);
    const readingPercent = Math.round((readingSecs / totalSecs) * 100);
    const diaryPercent = Math.round((diarySecs / totalSecs) * 100);
    const othersPercent = 100 - prayerPercent - readingPercent - diaryPercent;

    return [
      { key: 'prayer', name: 'Oração Diária', minutes: prayerMin, percent: Math.max(prayerPercent, 0), color: 'stroke-sky-500', fill: 'bg-sky-500' },
      { key: 'reading', name: 'Estudo Bíblico', minutes: readingMin, percent: Math.max(readingPercent, 0), color: 'stroke-indigo-500', fill: 'bg-indigo-500' },
      { key: 'diary', name: 'Exame & Diário', minutes: diaryMin, percent: Math.max(diaryPercent, 0), color: 'stroke-emerald-500', fill: 'bg-emerald-500' },
      { key: 'others', name: 'Outras Disciplinas', minutes: othersMin, percent: Math.max(othersPercent, 0), color: 'stroke-slate-500', fill: 'bg-slate-500' }
    ].filter(d => d.percent > 0 || d.minutes > 0);
  }, [historyFiltered]);

  // General Hexagonal Radar scores (Oração, Leitura, Hábitos, Constância, Intercessão, Disciplina)
  const generalRadarScores = useMemo(() => {
    return getGeneralRadar(historyFiltered, habits.length, profile.streak);
  }, [historyFiltered, habits, profile]);

  const maxRadarVal = 100;

  // Donut coordinates calculation helper
  const donutPaths = useMemo(() => {
    let accumulatedPercent = 0;
    const radius = 60;
    const cx = 100;
    const cy = 100;
    const circ = 2 * Math.PI * radius;

    return donutData.map(slice => {
      const offset = circ - (circ * accumulatedPercent) / 100;
      const strokeDash = (circ * slice.percent) / 100;
      
      accumulatedPercent += slice.percent;

      return {
        ...slice,
        strokeDash: `${strokeDash} ${circ - strokeDash}`,
        offset
      };
    });
  }, [donutData]);

  // Dimensions
  const width = 500;
  const height = 150;
  const padding = 20;

  return (
    <div className="space-y-6">
      
      {/* Horiz tab selections */}
      <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-850/80 max-w-xl">
        <button
          onClick={() => setActiveSubView('habits')}
          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubView === 'habits' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Gráfico de Hábitos
        </button>
        <button
          onClick={() => setActiveSubView('donut')}
          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubView === 'donut' ? 'bg-indigo-500 text-slate-100 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          Distribuição do Tempo
        </button>
        <button
          onClick={() => setActiveSubView('radar')}
          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubView === 'radar' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Radar das 6 Virtudes
        </button>
      </div>

      {/* SUBVIEW CONTAINER */}
      <div className="bg-slate-950/40 border border-slate-850/60 p-5 rounded-3xl space-y-5 shadow-inner">
        
        {/* VIEW 1: STACKED HABITS DAILY */}
        {activeSubView === 'habits' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Metrificação e Equilíbrio de Hábitos</span>
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                Porcentagem de Categorias Concluídas
              </h3>
            </div>

            {/* Stacked Bars SVG drawing */}
            <div className="w-full h-36 relative">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                
                {/* Horizontal dotted ceilings lines */}
                {[0, 0.5, 1].map((r, i) => {
                  const yPos = padding + r * (height - 2 * padding);
                  const labelVal = Math.round(maxDayCompletions * (1 - r));
                  return (
                    <g key={i} className="opacity-[0.12]">
                      <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} className="stroke-slate-100 stroke-[0.5]" strokeDasharray="3 3" />
                      <text x={padding + 5} y={yPos - 3} className="fill-slate-300 font-mono text-[8px] font-black">{labelVal} hábitos</text>
                    </g>
                  );
                })}

                {/* Bars group drawing stack */}
                {dailyStackedHabits.map((day, dIdx) => {
                  const n = dailyStackedHabits.length;
                  const barWidth = Math.max(Math.min((width - 2 * padding) / n - 4, 18), 3);
                  const xPos = padding + (dIdx * (width - 2 * padding)) / Math.max(n - 1, 1) - barWidth / 2;

                  // Stack values
                  let currentYOffset = 0;

                  return (
                    <g key={dIdx} className="group cursor-help">
                      {/* Stack loops of categories */}
                      {Object.entries(day.counts).map(([cat, val]) => {
                        const count = val as number;
                        if (count === 0) return null;

                        const barHeight = (count * (height - 2 * padding)) / maxDayCompletions;
                        const yPos = height - padding - barHeight - currentYOffset;
                        currentYOffset += barHeight;

                        // Retrieve category styles
                        const styles = CATEGORY_COLORS[cat] || { bg: 'bg-slate-550' };
                        const colorClass = styles.bg === 'bg-amber-500' ? '#f59e0b' :
                                           styles.bg === 'bg-indigo-500' ? '#6366f1' :
                                           styles.bg === 'bg-sky-500' ? '#0ea5e9' :
                                           styles.bg === 'bg-emerald-500' ? '#10b981' : '#f43f5e';

                        return (
                          <motion.rect
                            key={cat}
                            initial={{ height: 0, y: height - padding }}
                            animate={{ height: barHeight, y: yPos }}
                            x={xPos}
                            y={yPos}
                            width={barWidth}
                            height={barHeight}
                            fill={colorClass}
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              {/* Labels */}
              <div className="flex justify-between text-[7px] font-mono font-bold text-slate-500 mt-1 px-4">
                {dailyStackedHabits.map((pt, idx) => {
                  const n = dailyStackedHabits.length;
                  if (n > 15 && idx % Math.ceil(n / 10) !== 0) return null;
                  return <span key={idx}>{pt.label}</span>;
                })}
              </div>
            </div>

            {/* Color keys legend list for categories */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-900">
              {Object.entries(CATEGORY_COLORS).map(([cat, styles]) => (
                <div key={cat} className="flex items-center gap-1.5 p-2 bg-slate-950 border border-slate-900 rounded-xl">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.bg} shrink-0`} />
                  <span className="text-[9px] font-bold text-slate-400 capitalize truncate">{styles.name}</span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 2: TIME DISTRIBUTION PIE / DONUT */}
        {activeSubView === 'donut' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Foco Altar do Santuário</span>
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                Distribuição Real de Horas Consagradas
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-900">
              
              {/* SVG Glowing Donut */}
              <div className="w-40 h-40 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="60" className="stroke-slate-900 stroke-[15] fill-transparent" />
                  
                  {donutPaths.map((slice, idx) => {
                    const colorHex = slice.key === 'prayer' ? '#0ea5e9' :
                                     slice.key === 'reading' ? '#6366f1' :
                                     slice.key === 'diary' ? '#10b981' : '#64748b';

                    return (
                      <motion.circle
                        key={slice.key}
                        cx="100"
                        cy="100"
                        r="60"
                        fill="transparent"
                        stroke={colorHex}
                        strokeWidth="15"
                        strokeDasharray={slice.strokeDash}
                        strokeDashoffset={slice.offset}
                        initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                        animate={{ strokeDashoffset: slice.offset }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="stroke-linecap-round cursor-help transition-all hover:stroke-[18]"
                      />
                    );
                  })}
                </svg>

                {/* Centered label */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-2xl font-black font-mono text-slate-100">
                    {donutData.reduce((sum, d) => sum + d.minutes, 0)}
                  </span>
                  <span className="text-[8px] uppercase font-bold text-slate-500 mt-0.5">min totais</span>
                </div>
              </div>

              {/* Detail legends list */}
              <div className="space-y-2.5 flex-1 w-full max-w-sm">
                {donutPaths.map((slice, idx) => (
                  <div key={slice.key} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900 rounded-xl hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${slice.fill} shrink-0`} />
                      <span className="text-xs font-bold text-slate-350">{slice.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-500">{slice.minutes} min</span>
                      <span className="text-emerald-400 font-bold">({slice.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 3: RADAR CHART 6 VIRTUES */}
        {activeSubView === 'radar' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Pontuação Dimensional das Disciplinas</span>
              <h3 className="text-md font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                Radar de Virtudes do Altar Espiritual
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-900">
              
              {/* SVG hexagonal radar chart */}
              <div className="w-48 h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="general-radar-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Hexagon background grids at 25, 50, 75, 100 */}
                  {[0.25, 0.5, 0.75, 1].map((scale, gIdx) => {
                    const radius = 72 * scale;
                    const points = Array.from({ length: 6 }).map((_, idx) => {
                      const theta = idx * (2 * Math.PI / 6) - Math.PI / 2;
                      const x = 100 + radius * Math.cos(theta);
                      const y = 100 + radius * Math.sin(theta);
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <polygon
                        key={gIdx}
                        points={points}
                        className="fill-transparent stroke-slate-800 stroke-[0.5]"
                        strokeDasharray={gIdx < 3 ? "2 2" : undefined}
                      />
                    );
                  })}

                  {/* Draw score polygon */}
                  {(() => {
                    const points = generalRadarScores.map((score, idx) => {
                      const r = 72 * (score.score / maxRadarVal);
                      const theta = idx * (2 * Math.PI / 6) - Math.PI / 2;
                      const x = 100 + r * Math.cos(theta);
                      const y = 100 + r * Math.sin(theta);
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <polygon
                        points={points}
                        fill="url(#general-radar-grad)"
                        className="stroke-emerald-405 stroke-[1.5]"
                      />
                    );
                  })()}

                  {/* Labels on vertices */}
                  {generalRadarScores.map((score, idx) => {
                    const theta = idx * (2 * Math.PI / 6) - Math.PI / 2;
                    const radius = 86;
                    const x = 100 + radius * Math.cos(theta);
                    const y = 100 + radius * Math.sin(theta);

                    let anchor = 'middle';
                    if (Math.cos(theta) > 0.1) anchor = 'start';
                    else if (Math.cos(theta) < -0.1) anchor = 'end';

                    return (
                      <text
                        key={idx}
                        x={x}
                        y={y + 3}
                        textAnchor={anchor}
                        className="fill-slate-400 font-bold font-sans text-[7.5px]"
                      >
                        {score.label}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Metric stats items list side-by-side */}
              <div className="grid grid-cols-2 gap-3 flex-1 w-full max-w-sm">
                {generalRadarScores.map((score, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      {score.label}
                    </span>
                    <span className="text-xs font-black font-mono text-emerald-450">{score.score} pts</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
