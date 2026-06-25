import React, { useState, useMemo } from 'react';
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
  LineChart,
  Grid,
  Zap,
  Info
} from 'lucide-react';
import { Habit, DayProgress } from '../types';

interface StatsTabProps {
  habits: Habit[];
  history: DayProgress[];
  streak: number;
  maxStreak: number;
}

export default function StatsTab({ habits, history, streak, maxStreak }: StatsTabProps) {
  // Navigation states inside Stats Tab
  const [activeChartSection, setActiveChartSection] = useState<'evolution' | 'comparison' | 'growth'>('evolution');
  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  // Parse dates safely
  const parseLocalDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  };

  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper date lists generator for the evolution chart
  const getPastDates = (days: number) => {
    const list: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(formatDate(d));
    }
    return list;
  };

  const periodDates = useMemo(() => {
    return timeframe === '7days' ? getPastDates(7) : getPastDates(30);
  }, [timeframe]);

  // Overall statistics counters
  const totalMeditationMinutes = useMemo(() => {
    const secs = history.reduce((sum, day) => sum + (day.meditationSeconds || 0), 0);
    return Math.round(secs / 60);
  }, [history]);

  const totalCompletions = useMemo(() => {
    return history.reduce((sum, day) => sum + (day.habitsCompleted ? day.habitsCompleted.length : 0), 0);
  }, [history]);

  // Habit completion comparison calculations
  const habitCompletionCounts = useMemo(() => {
    const counts: { [habitId: string]: { name: string; count: number; category: string } } = {};
    
    // Seed all habits
    habits.forEach(h => {
      counts[h.id] = { name: h.name, count: 0, category: h.category };
    });

    // Count history occurrences
    history.forEach(day => {
      if (day.habitsCompleted) {
        day.habitsCompleted.forEach(id => {
          if (counts[id]) {
            counts[id].count += 1;
          }
        });
      }
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [habits, history]);

  // Evolution chart data assembler
  const chartData = useMemo(() => {
    return periodDates.map(dateStr => {
      const parsedDate = parseLocalDate(dateStr);
      const label = timeframe === '7days' 
        ? parsedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        : parsedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });

      const dayLog = history.find(h => h.date === dateStr);
      const habitsCount = dayLog?.habitsCompleted?.length || 0;
      const prayerSecs = dayLog?.meditationSeconds || 0;
      const prayerMin = Math.round(prayerSecs / 60);

      // Distinguish reading vs prayer if logs have session metadata
      let prayerOnlySecs = 0;
      let readingOnlySecs = 0;
      if (dayLog?.sessions && dayLog.sessions.length > 0) {
        dayLog.sessions.forEach(s => {
          if (s.tag === 'leitura') {
            readingOnlySecs += s.durationSeconds;
          } else {
            prayerOnlySecs += s.durationSeconds;
          }
        });
      } else {
        prayerOnlySecs = prayerSecs;
      }

      return {
        date: dateStr,
        label,
        completions: habitsCount,
        prayerMinutes: Math.round(prayerOnlySecs / 60),
        readingMinutes: Math.round(readingOnlySecs / 60),
        totalMinutes: prayerMin
      };
    });
  }, [periodDates, history, timeframe]);

  // Growth/XP trend over time
  const growthTrendData = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let cumulativeXP = 0;
    let cumulativeMinutes = 0;

    return sortedHistory.map(day => {
      // Calculate XP earned this day: 15 per habit, 10 per meditation minute, 10 per reflection
      const habitsXP = (day.habitsCompleted?.length || 0) * 15;
      const meditationXP = Math.round((day.meditationSeconds || 0) / 60) * 10;
      const reflectionXP = day.reflection && day.reflection.trim() ? 10 : 0;
      
      cumulativeXP += (habitsXP + meditationXP + reflectionXP);
      cumulativeMinutes += Math.round((day.meditationSeconds || 0) / 60);

      return {
        date: day.date,
        cumulativeXP,
        cumulativeMinutes
      };
    }).slice(-15); // Show last 15 active days for clean desktop scale
  }, [history]);

  // Redesigned Calendar grid generator with month offsetting
  const calendarDetails = useMemo(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + selectedMonthOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 Sunday, 1 Monday...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    // Construct days array with padding for previous month offset
    const daysArray = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Map with completed data
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayLog = history.find(h => h.date === dateStr);
      const completedCount = dayLog?.habitsCompleted?.length || 0;
      const totalPossible = habits.length || 1;
      const ratio = totalPossible > 0 ? completedCount / totalPossible : 0;
      const isPerfect = ratio === 1 && totalPossible > 0;

      daysArray.push({
        day: d,
        dateStr,
        completedCount,
        totalPossible,
        ratio,
        isPerfect,
        meditationSeconds: dayLog?.meditationSeconds || 0
      });
    }
    
    return {
      monthLabel,
      daysArray
    };
  }, [selectedMonthOffset, history, habits]);

  // Scaler factors for SVGs
  const maxCompletions = Math.max(...chartData.map(d => d.completions), 1);
  const maxMinutes = Math.max(...chartData.map(d => d.totalMinutes), 5);
  const maxGrowthXP = Math.max(...growthTrendData.map(d => d.cumulativeXP), 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingUp className="text-amber-500 w-6 h-6" />
          Métricas de Perseverança
        </h2>
        <p className="text-slate-400 text-sm">
          Analise o desenvolvimento de sua rotina de fé, assiduidade bíblica e minutos acumulados sob oração em gráficos profissionais.
        </p>
      </div>

      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Streak card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl relative overflow-hidden flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <Flame className="w-5.5 h-5.5 fill-amber-500/10" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Ofensiva Hoje</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
              {streak} <span className="text-[10px] text-slate-500 font-sans font-normal">dias</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Recorde: {maxStreak}d</span>
          </div>
        </div>

        {/* Total prayer minutes card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl relative overflow-hidden flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Vigília Total</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
              {totalMeditationMinutes} <span className="text-[10px] text-slate-500 font-sans font-normal">min</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Horas de comunhão ativa</span>
          </div>
        </div>

        {/* Completed tasks card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl relative overflow-hidden flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Devocionais</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
              {totalCompletions} <span className="text-[10px] text-slate-500 font-sans font-normal">feitos</span>
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Atividades marcadas</span>
          </div>
        </div>

        {/* Global fidelity percentage card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl relative overflow-hidden flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Zap className="w-5.5 h-5.5 fill-emerald-500/10" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Assiduidade</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
              {history.length > 0 
                ? Math.round((history.filter(h => h.habitsCompleted.length > 0).length / Math.max(history.length, 1)) * 100) 
                : 0}%
            </span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Fidelidade aos propósitos</span>
          </div>
        </div>

      </div>

      {/* Main Charts Block */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-5">
        
        {/* Navigation subtabs for stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveChartSection('evolution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeChartSection === 'evolution' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Evolução Periódica
            </button>
            <button
              onClick={() => setActiveChartSection('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeChartSection === 'comparison' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Hábitos Frequentes
            </button>
            <button
              onClick={() => setActiveChartSection('growth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeChartSection === 'growth' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Tendência de Crescimento
            </button>
          </div>

          {activeChartSection === 'evolution' && (
            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850 self-end sm:self-auto">
              <button
                onClick={() => setTimeframe('7days')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  timeframe === '7days' ? 'bg-slate-800 text-amber-400 border border-slate-700/40' : 'text-slate-400'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setTimeframe('30days')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  timeframe === '30days' ? 'bg-slate-800 text-amber-400 border border-slate-700/40' : 'text-slate-400'
                }`}
              >
                30 Dias
              </button>
            </div>
          )}
        </div>

        {/* Render Chart panels */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            
            {/* Panel A: Periodic Evolution (Bar Chart) */}
            {activeChartSection === 'evolution' && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Habits Bar Chart */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Completados Diários (Hábitos)</span>
                    
                    <div className="h-44 flex items-end gap-1 px-1.5 pt-4">
                      {chartData.map((d, index) => {
                        const hRatio = d.completions > 0 ? (d.completions / maxCompletions) * 100 : 3;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default">
                            {/* Bar item */}
                            <div className="w-full bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end h-full relative border border-slate-850">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${hRatio}%` }}
                                transition={{ duration: 0.4, delay: index * 0.01 }}
                                className={`w-full rounded-t-sm ${d.completions > 0 ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/5' : 'bg-slate-850'}`}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 mt-2 truncate max-w-full text-center">
                              {d.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prayer vs Reading minutes */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Tempo de Vigília e Leitura (Minutos)</span>
                      <div className="flex gap-2 text-[8px] font-extrabold uppercase font-sans">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Oração</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Leitura</span>
                      </div>
                    </div>

                    <div className="h-44 flex items-end gap-1.5 px-1.5 pt-4">
                      {chartData.map((d, index) => {
                        const pRatio = d.prayerMinutes > 0 ? (d.prayerMinutes / maxMinutes) * 100 : 3;
                        const rRatio = d.readingMinutes > 0 ? (d.readingMinutes / maxMinutes) * 100 : 3;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default">
                            <div className="w-full h-full flex items-end gap-0.5">
                              {/* Prayer column */}
                              <div className="flex-1 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end h-full relative border border-slate-850">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${pRatio}%` }}
                                  transition={{ duration: 0.4, delay: index * 0.01 }}
                                  className={`w-full rounded-t-sm ${d.prayerMinutes > 0 ? 'bg-amber-500' : 'bg-slate-850'}`}
                                />
                              </div>
                              {/* Reading column */}
                              <div className="flex-1 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end h-full relative border border-slate-850">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${rRatio}%` }}
                                  transition={{ duration: 0.4, delay: index * 0.01 }}
                                  className={`w-full rounded-t-sm ${d.readingMinutes > 0 ? 'bg-indigo-500' : 'bg-slate-850'}`}
                                />
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 mt-2 truncate max-w-full text-center">
                              {d.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Panel B: Habits Comparison List */}
            {activeChartSection === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Ranking de Frequência de Conclusão</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ordenado de mais ativo para menos ativo</span>
                </div>

                {habitCompletionCounts.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                    <p className="text-xs text-slate-500 italic">Preencha o diário local e marque hábitos para calcular o ranking.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habitCompletionCounts.map((hc, idx) => {
                      const maxCount = Math.max(...habitCompletionCounts.map(h => h.count), 1);
                      const widthPercent = Math.max(Math.round((hc.count / maxCount) * 100), 4);
                      return (
                        <div key={idx} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-200 block truncate">{hc.name}</span>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-850/40">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${widthPercent}%` }}
                                transition={{ duration: 0.5, delay: idx * 0.05 }}
                                className="h-full bg-amber-500"
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {hc.count} {hc.count === 1 ? 'conclusão' : 'conclusões'}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-500">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Panel C: Growth / Accumulated trend */}
            {activeChartSection === 'growth' && (
              <motion.div
                key="growth"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Tendência Acumulada de Crescimento Espiritual</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Evolução do seu saldo acumulado de XP nos últimos 15 registros ativos</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">Saldo Máximo: {maxGrowthXP} XP</span>
                </div>

                {growthTrendData.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                    <p className="text-xs text-slate-500 italic">Sua tendência de crescimento será gerada conforme você acumular XP diário.</p>
                  </div>
                ) : (
                  <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-850/50 h-44 flex items-end gap-1 pt-6">
                    {growthTrendData.map((gt, idx) => {
                      const heightPercent = Math.max(Math.round((gt.cumulativeXP / maxGrowthXP) * 100), 5);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default">
                          <div className="w-full bg-slate-900 border border-slate-850 rounded-md overflow-hidden flex flex-col justify-end h-full">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ duration: 0.4, delay: idx * 0.02 }}
                              className="w-full bg-gradient-to-t from-indigo-600 to-amber-500/80"
                            />
                          </div>
                          <span className="text-[7px] font-mono text-slate-500 mt-2 rotate-45 origin-left whitespace-nowrap hidden sm:inline">
                            {gt.date.substring(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Redesigned Calendar Grid Box */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
        
        {/* Month Selector header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-200 flex items-center gap-2">
              <Calendar className="text-indigo-400 w-5 h-5" />
              Calendário de Assiduidade Devocional
            </h3>
            <p className="text-[10px] text-slate-500">Visualize conquistas e sequências de preces registradas</p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 self-end sm:self-auto">
            <button 
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-200 uppercase min-w-[140px] text-center font-mono">
              {calendarDetails.monthLabel}
            </span>
            <button 
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-2xl border border-slate-950">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-slate-950 rounded-lg border border-slate-850 shrink-0" />
            <span>Sem registros</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-indigo-950/80 rounded-lg border border-indigo-900/40 shrink-0" />
            <span>Devocional Parcial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-indigo-600 rounded-lg border border-indigo-400/40 shrink-0" />
            <span>Fidelidade Ativa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-lg border border-amber-400/50 shrink-0" />
            <span>Comunhão Total ⭐</span>
          </div>
        </div>

        {/* Calendar visual layout */}
        <div className="max-w-md mx-auto sm:mx-0 pt-2">
          <div className="grid grid-cols-7 gap-1.5">
            
            {/* Days headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
              <div key={dayName} className="text-center text-[10px] font-black text-slate-500 py-1 uppercase tracking-wider font-mono">
                {dayName}
              </div>
            ))}

            {/* Render days */}
            {calendarDetails.daysArray.map((cell, index) => {
              if (!cell) {
                return <div key={`pad-${index}`} className="aspect-square bg-transparent rounded-xl" />;
              }

              const medMin = Math.round(cell.meditationSeconds / 60);
              const completedCount = cell.completedCount;
              const hasActivity = completedCount > 0 || medMin > 0;
              const isPerfect = cell.isPerfect;

              let cellStyle = 'bg-slate-950/50 border-slate-850 hover:border-slate-700 text-slate-400';
              
              if (hasActivity) {
                if (isPerfect && medMin > 0) {
                  // Super communion: all habits + prayer session
                  cellStyle = 'bg-gradient-to-tr from-amber-500 to-indigo-600 border-amber-400 text-slate-100 font-extrabold shadow-sm hover:shadow-lg shadow-amber-500/5';
                } else if (isPerfect) {
                  // Gold star: all habits checked
                  cellStyle = 'bg-amber-500 border-amber-400 text-slate-950 font-black';
                } else if (medMin > 0 && completedCount === 0) {
                  // Prayer only
                  cellStyle = 'bg-indigo-950 border-indigo-900 text-slate-300 font-semibold';
                } else {
                  // Partial checklist completion
                  const ratio = cell.ratio;
                  if (ratio >= 0.7) {
                    cellStyle = 'bg-indigo-500 text-slate-100 border-indigo-400 font-bold';
                  } else if (ratio >= 0.4) {
                    cellStyle = 'bg-indigo-800 text-slate-200 border-indigo-600';
                  } else {
                    cellStyle = 'bg-indigo-950/80 text-slate-300 border-indigo-900/50';
                  }
                }
              }

              return (
                <div
                  key={`day-${cell.day}`}
                  className={`aspect-square ${cellStyle} rounded-xl flex flex-col items-center justify-center relative cursor-help select-none transition-all border group p-1`}
                >
                  <span className="text-[10px] font-bold font-mono">{cell.day}</span>
                  
                  {/* Visual Gold Star / Indicator badge inside the cell */}
                  {isPerfect && (
                    <span className="text-[8px] absolute top-0.5 right-0.5 leading-none">⭐</span>
                  )}

                  {medMin > 0 && !isPerfect && (
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full absolute bottom-1.5" />
                  )}

                  {/* Cell details popup tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] p-2.5 rounded-xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-20 w-32 -translate-y-16 text-center shadow-2xl">
                    <p className="font-bold text-slate-200">{cell.dateStr}</p>
                    <p className="mt-1 text-slate-400 font-sans">{completedCount} de {cell.totalPossible} habits</p>
                    {medMin > 0 && (
                      <p className="text-sky-400 font-mono mt-0.5">{medMin} min oração</p>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* Advice Card */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-start gap-2 text-slate-500 text-[10px] leading-relaxed">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          As métricas de perseverança são compiladas cruzando os dias ativos na base de dados local, oferecendo comparações realistas de hábitos em tempo real sem expor dados pessoais à nuvem.
        </span>
      </div>

    </motion.div>
  );
}
