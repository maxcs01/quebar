import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Info,
  BookOpen,
  Compass,
  Sliders,
  Activity,
  Award as AwardIcon
} from 'lucide-react';

import { Habit, DayProgress, UserProfile } from '../types';
import LevelsTab from './LevelsTab';
import StatsTabSummary from './StatsTabSummary';
import StatsTabCharts from './StatsTabCharts';
import StatsTabHabits from './StatsTabHabits';
import StatsTabAchievements from './StatsTabAchievements';
import { 
  getFilteredContext, 
  TimeframeOption, 
  parseLocalDate, 
  formatDate,
  getPastDates
} from '../utils/statsCalculator';

interface StatsTabProps {
  habits: Habit[];
  history: DayProgress[];
  streak: number;
  maxStreak: number;
  profile: UserProfile;
  activeSubTab?: 'evolution' | 'distribution' | 'heatmap' | 'levels';
  onSubTabChange?: (tab: 'evolution' | 'distribution' | 'heatmap' | 'levels') => void;
}

export default function StatsTab({ 
  habits, 
  history, 
  streak, 
  maxStreak,
  profile,
  activeSubTab,
  onSubTabChange
}: StatsTabProps) {
  
  // High-fidelity local tab management synced with parent Tab state
  const [localTab, setLocalTab] = useState<'summary' | 'evolution' | 'distribution' | 'heatmap' | 'achievements' | 'levels'>('summary');

  useEffect(() => {
    if (activeSubTab) {
      setLocalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSelect = (tab: 'summary' | 'evolution' | 'distribution' | 'heatmap' | 'achievements' | 'levels') => {
    setLocalTab(tab);
    if (onSubTabChange && (tab === 'evolution' || tab === 'distribution' || tab === 'heatmap' || tab === 'levels')) {
      onSubTabChange(tab);
    }
  };

  // Filter timeframe bar state
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  
  // Custom date selection inputs state
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return formatDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => formatDate(new Date()));

  // Active month offset for the consistency month calendar
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  // Filter context calculation
  const filteredCtx = useMemo(() => {
    return getFilteredContext(history, habits, timeframe, customStart, customEnd);
  }, [history, habits, timeframe, customStart, customEnd]);

  // Annual Heatmap Data Generator (105 days / 15 weeks matrix)
  const heatmapData = useMemo(() => {
    const totalDays = 105;
    const dates = getPastDates(totalDays);
    const grid: { date: string, completions: number, meditationMin: number, level: number }[][] = Array.from({ length: 7 }, () => []);

    dates.forEach((dateStr, idx) => {
      const dayLog = history.find(h => h.date === dateStr);
      const completions = dayLog?.habitsCompleted?.length || 0;
      
      let pSecs = 0;
      if (dayLog?.sessions && dayLog.sessions.length > 0) {
        dayLog.sessions.forEach(s => {
          if (s.tag !== 'leitura') pSecs += s.durationSeconds;
        });
      } else {
        pSecs += dayLog?.meditationSeconds || 0;
      }
      const meditationMin = Math.round(pSecs / 60);

      // Value color intensity levels
      let level = 0;
      if (completions > 0 || meditationMin > 0) {
        if (completions === habits.length && meditationMin > 0) level = 4; // communion total
        else if (completions >= habits.length * 0.75) level = 3;
        else if (completions >= habits.length * 0.4) level = 2;
        else level = 1;
      }

      const colIdx = Math.floor(idx / 7);
      const rowIdx = idx % 7;

      if (grid[rowIdx]) {
        grid[rowIdx][colIdx] = {
          date: dateStr.split('-').reverse().join('/'),
          completions,
          meditationMin,
          level
        };
      }
    });

    return grid;
  }, [history, habits]);

  // Month-by-month consistency calendar assembler
  const calendarDetails = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + selectedMonthOffset;

    // Computed targeted date
    const targetDate = new Date(currentYear, currentMonth, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const monthLabel = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Days count in target month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    // Weekday of first day of target month (0: Sun, 1: Mon...)
    const firstDayIndex = new Date(year, month, 1).getDay();

    const daysArray: ({ dateStr: string, completedCount: number, meditationSeconds: number, isPerfect: boolean, ratio: number } | null)[] = [];

    // Fill offset padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    // Populate calendar cells
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      const dayProgress = history.find(h => h.date === dateStr);
      const completedCount = dayProgress?.habitsCompleted?.length || 0;

      let pSecs = 0;
      if (dayProgress?.sessions && dayProgress.sessions.length > 0) {
        dayProgress.sessions.forEach(s => {
          if (s.tag !== 'leitura') pSecs += s.durationSeconds;
        });
      } else {
        pSecs += dayProgress?.meditationSeconds || 0;
      }

      const totalPossible = habits.length || 5;
      const isPerfect = completedCount === totalPossible;
      const ratio = totalPossible > 0 ? completedCount / totalPossible : 0;

      daysArray.push({
        dateStr,
        completedCount,
        meditationSeconds: pSecs,
        isPerfect,
        ratio
      });
    }

    return {
      monthLabel,
      daysArray
    };
  }, [history, habits, selectedMonthOffset]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-850 shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portal Analítico</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">Métricas de Consagração</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-lg">
            Acompanhe o florescer do seu Altar Espiritual. Visualize gráficos de clamor, evolução de sabedoria e consistência litúrgica.
          </p>
        </div>

        {/* Global Streak Mini Badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Ofensiva Temporal</span>
            <span className="text-sm font-black text-slate-200 font-mono block">{streak} dias seguidos</span>
          </div>
        </div>
      </div>

      {/* FILTER PERIOD BAR (Not shown in standard levels sub-tab for simplicity) */}
      {localTab !== 'levels' && localTab !== 'achievements' && (
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-400" />
              Filtrar Período de Análise
            </span>

            {/* Timeframe option triggers */}
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900 self-start sm:self-auto">
              {([
                { key: 'hoje', name: 'Hoje' },
                { key: '7d', name: '7 Dias' },
                { key: '15d', name: '15 Dias' },
                { key: '30d', name: '30 Dias' },
                { key: '90d', name: '90 Dias' },
                { key: '6m', name: '6 Meses' },
                { key: '1y', name: '1 Ano' },
                { key: 'custom', name: 'Personalizado' }
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTimeframe(opt.key)}
                  className={`px-2.5 py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    timeframe === opt.key ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Custom inputs */}
          {timeframe === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex flex-wrap gap-4 pt-2 border-t border-slate-950/40"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">Data de Início</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">Data Final</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* STATS SECTION TABS */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Navigation Bar (The 6 subtabs) */}
        <div className="flex overflow-x-auto border-b border-slate-850 scrollbar-none bg-slate-950/40">
          {[
            { key: 'summary', name: 'Resumo & Insights', icon: Sparkles },
            { key: 'evolution', name: 'Gráficos de Fé', icon: BarChart3 },
            { key: 'distribution', name: 'Hábitos & Foco', icon: Compass },
            { key: 'heatmap', name: 'Consistência', icon: Calendar },
            { key: 'achievements', name: 'Conquistas', icon: AwardIcon },
            { key: 'levels', name: 'Níveis', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = localTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabSelect(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isSelected 
                    ? 'border-sky-400 text-sky-400 bg-sky-500/[0.02] font-black' 
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* SUBTAB VIEW ROUTER */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* 1. Resumo & Insights View */}
            {localTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsTabSummary 
                  history={history} 
                  habits={habits} 
                  profile={profile} 
                />
              </motion.div>
            )}

            {/* 2. Gráficos de Fé View */}
            {localTab === 'evolution' && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsTabCharts 
                  days={filteredCtx.days}
                  historyFiltered={filteredCtx.historyFiltered}
                  habits={habits}
                  profile={profile}
                />
              </motion.div>
            )}

            {/* 3. Hábitos & Foco View */}
            {localTab === 'distribution' && (
              <motion.div
                key="distribution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsTabHabits 
                  days={filteredCtx.days}
                  historyFiltered={filteredCtx.historyFiltered}
                  habits={habits}
                  profile={profile}
                />
              </motion.div>
            )}

            {/* 4. Consistência (Heatmap + calendars) */}
            {localTab === 'heatmap' && (
              <motion.div
                key="heatmap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* 4A: Annual Heatmap widget */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Mapa de Calor de Consistência</span>
                    <h3 className="text-md font-bold text-slate-200 mt-0.5">Mapeamento dos Últimos 105 Dias</h3>
                    <p className="text-[10px] text-slate-500 leading-normal">Sua assiduidade espiritual dividida em 15 semanas contínuas</p>
                  </div>

                  {/* Heatmap Layout with scroll support */}
                  <div className="overflow-x-auto pb-2 scrollbar-thin">
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-3xl min-w-[560px] md:min-w-0 flex flex-col justify-center">
                      <div className="flex gap-1.5">
                        {/* Weekday guides */}
                        <div className="flex flex-col justify-between text-[8px] font-black text-slate-650 font-mono pr-2 h-[84px] select-none">
                          <span>Dom</span>
                          <span>Ter</span>
                          <span>Qui</span>
                          <span>Sáb</span>
                        </div>

                        {/* Grid matrix */}
                        <div className="flex-1 grid grid-flow-col auto-cols-max gap-1">
                          {heatmapData.map((row, rIdx) => (
                            <React.Fragment key={rIdx}>
                              {row.map((day, dIdx) => {
                                let cellBg = 'bg-slate-900/40 border-slate-950';
                                if (day.level === 1) cellBg = 'bg-sky-950/40 border-sky-900/10 text-sky-300';
                                else if (day.level === 2) cellBg = 'bg-sky-900/40 border-sky-700/20 text-sky-200';
                                else if (day.level === 3) cellBg = 'bg-sky-500/30 border-sky-400/30 text-sky-100 font-bold';
                                else if (day.level === 4) cellBg = 'bg-gradient-to-br from-emerald-500 to-sky-500 text-slate-950 font-black border-emerald-350 shadow-sm';

                                return (
                                  <div
                                    key={`${rIdx}-${dIdx}`}
                                    className={`w-2.5 h-2.5 rounded-[2px] border ${cellBg} relative group cursor-help transition-all hover:scale-125`}
                                  >
                                    <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[9px] p-2 rounded-xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-35 w-32 -translate-y-14 -translate-x-12 text-center shadow-2xl">
                                      <p className="font-bold text-slate-200">{day.date}</p>
                                      <p className="text-slate-400 mt-0.5">{day.completions} hábitos</p>
                                      <p className="text-sky-400 font-mono">{day.meditationMin} min oração</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Legend guide */}
                      <div className="flex items-center justify-end gap-1.5 text-[8px] font-bold text-slate-600 font-mono mt-3 px-2">
                        <span>Menos</span>
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-900/40 border border-slate-950" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-sky-950/40 border-sky-900/10" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-sky-900/40 border-sky-700/20" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-sky-500/30 border-sky-400/30" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-350" />
                        <span>Mais</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4B: Re-styled month-by-month Consistency Calendar */}
                <div className="bg-slate-950/60 p-5 rounded-3xl border border-slate-900 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                        <Calendar className="text-sky-400 w-4.5 h-4.5" />
                        Calendário de Assiduidade Espiritual
                      </h3>
                      <p className="text-[10px] text-slate-500">Mapeamento dos dias com preces, leituras e hábitos sacramentados</p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-850 self-end sm:self-auto">
                      <button 
                        onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-slate-250 uppercase min-w-[130px] text-center font-mono">
                        {calendarDetails.monthLabel}
                      </span>
                      <button 
                        onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Legend guides */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] text-slate-450 bg-slate-950/40 p-2.5 rounded-xl border border-slate-950/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-900/40 rounded border border-slate-850 shrink-0" />
                      <span>Sem registros</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-sky-950/70 rounded border border-sky-900/40 shrink-0" />
                      <span>Atividade Parcial</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-sky-500/80 rounded border border-sky-450 shrink-0" />
                      <span>Consagração Completa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-sky-500 rounded border border-emerald-350 shrink-0" />
                      <span>Comunhão Total ⭐</span>
                    </div>
                  </div>

                  {/* Calendar visual cells */}
                  <div className="max-w-md mx-auto sm:mx-0 pt-1">
                    <div className="grid grid-cols-7 gap-1.5">
                      
                      {/* Week headers */}
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
                        <div key={dayName} className="text-center text-[10px] font-black text-slate-500 py-0.5 uppercase tracking-wider font-mono">
                          {dayName}
                        </div>
                      ))}

                      {/* Cells */}
                      {calendarDetails.daysArray.map((cell, index) => {
                        if (!cell) {
                          return <div key={`pad-${index}`} className="aspect-square bg-transparent rounded-xl" />;
                        }

                        const medMin = Math.round(cell.meditationSeconds / 60);
                        const completedCount = cell.completedCount;
                        const hasActivity = completedCount > 0 || medMin > 0;
                        const isPerfect = cell.isPerfect;

                        let cellStyle = 'bg-slate-900/40 border-slate-850 hover:border-slate-700 text-slate-400';
                        
                        if (hasActivity) {
                          if (isPerfect && medMin > 0) {
                            cellStyle = 'bg-gradient-to-tr from-emerald-500 to-sky-500 border-emerald-350 text-slate-950 font-extrabold shadow-sm';
                          } else if (isPerfect) {
                            cellStyle = 'bg-sky-500 border-sky-400 text-slate-950 font-black';
                          } else if (medMin > 0 && completedCount === 0) {
                            cellStyle = 'bg-sky-950/80 border-sky-900/60 text-sky-300 font-semibold';
                          } else {
                            const ratio = cell.ratio;
                            if (ratio >= 0.7) {
                              cellStyle = 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold';
                            } else if (ratio >= 0.4) {
                              cellStyle = 'bg-sky-905 bg-sky-900 text-slate-100 border-sky-700';
                            } else {
                              cellStyle = 'bg-sky-950/40 text-slate-300 border-sky-950';
                            }
                          }
                        }

                        const dayNum = parseInt(cell.dateStr.split('-')[2], 10);

                        return (
                          <div
                            key={cell.dateStr}
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs relative group cursor-pointer transition-all hover:scale-105 ${cellStyle}`}
                          >
                            <span className="font-mono font-bold">{dayNum}</span>
                            {isPerfect && (
                              <span className="absolute bottom-1 text-[7px] leading-none select-none">⭐</span>
                            )}
                            
                            {/* Hover calendar tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[9px] p-2.5 rounded-2xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-30 w-36 text-center -translate-y-16 shadow-2xl">
                              <p className="font-bold text-slate-200">{cell.dateStr.split('-').reverse().join('/')}</p>
                              <p className="text-slate-450 mt-0.5">{completedCount} hábitos concluídos</p>
                              {medMin > 0 && (
                                <p className="text-sky-400 font-mono font-bold">{medMin} min oração</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* 5. Conquistas & Linha do Tempo */}
            {localTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsTabAchievements 
                  history={history}
                  habits={habits}
                  profile={profile}
                />
              </motion.div>
            )}

            {/* 6. Níveis (Escalada do progresso) */}
            {localTab === 'levels' && (
              <motion.div
                key="levels"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LevelsTab profile={profile} history={history} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
