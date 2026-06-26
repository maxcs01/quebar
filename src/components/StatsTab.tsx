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
  Info,
  BookOpen,
  PieChart,
  Compass
} from 'lucide-react';
import { Habit, DayProgress, UserProfile } from '../types';
import LevelsTab from './LevelsTab';

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
  // Navigation inside Stats Tab
  const [localActiveChartSection, setLocalActiveChartSection] = useState<'evolution' | 'distribution' | 'heatmap' | 'levels'>('evolution');
  const activeChartSection = activeSubTab || localActiveChartSection;
  const setActiveChartSection = onSubTabChange || setLocalActiveChartSection;

  const [timeframe, setTimeframe] = useState<'7days' | '15days' | '30days'>('7days');
  const [evolutionChartType, setEvolutionChartType] = useState<'habits' | 'prayer' | 'reading'>('habits');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  // Safe Date Handlers
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

  const periodDaysCount = useMemo(() => {
    if (timeframe === '7days') return 7;
    if (timeframe === '15days') return 15;
    return 30;
  }, [timeframe]);

  const periodDates = useMemo(() => {
    return getPastDates(periodDaysCount);
  }, [periodDaysCount]);

  // Overall Statistics Metrics
  const totalMeditationMinutes = useMemo(() => {
    const secs = history.reduce((sum, day) => sum + (day.meditationSeconds || 0), 0);
    return Math.round(secs / 60);
  }, [history]);

  const totalCompletions = useMemo(() => {
    return history.reduce((sum, day) => sum + (day.habitsCompleted ? day.habitsCompleted.length : 0), 0);
  }, [history]);

  // Evolution chart data assembler
  const chartData = useMemo(() => {
    return periodDates.map((dateStr, idx) => {
      const parsedDate = parseLocalDate(dateStr);
      
      // Determine if we should display the label to avoid visual clutter
      let label = '';
      if (timeframe === '7days') {
        label = parsedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      } else if (timeframe === '15days') {
        // Show every 2nd day
        if (idx % 2 === 0) {
          label = parsedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
        }
      } else {
        // 30 days view: Show label every 4 days
        if (idx % 4 === 0) {
          label = parsedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
        }
      }

      const dayLog = history.find(h => h.date === dateStr);
      const habitsCount = dayLog?.habitsCompleted?.length || 0;
      const totalSecs = dayLog?.meditationSeconds || 0;

      // Extract details
      let prayerOnlySecs = 0;
      let readingOnlySecs = 0;
      let vigilSecs = 0;

      if (dayLog?.sessions && dayLog.sessions.length > 0) {
        dayLog.sessions.forEach(s => {
          if (s.tag === 'leitura') {
            readingOnlySecs += s.durationSeconds;
          } else if (s.tag === 'despertar' || s.tag === 'noite') {
            vigilSecs += s.durationSeconds;
          } else {
            prayerOnlySecs += s.durationSeconds;
          }
        });
      } else {
        prayerOnlySecs = totalSecs;
      }

      return {
        date: dateStr,
        label,
        completions: habitsCount,
        prayerMinutes: Math.round(prayerOnlySecs / 60),
        readingMinutes: Math.round(readingOnlySecs / 60),
        vigilMinutes: Math.round(vigilSecs / 60),
        totalMinutes: Math.round(totalSecs / 60)
      };
    });
  }, [periodDates, history, timeframe]);

  // Scalers factors
  const maxCompletions = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.completions), 1);
    return max;
  }, [chartData]);

  const maxMinutes = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.totalMinutes), 5);
    return max;
  }, [chartData]);

  const maxPrayerMinutes = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.prayerMinutes), 5);
    return max;
  }, [chartData]);

  const maxReadingMinutes = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.readingMinutes), 5);
    return max;
  }, [chartData]);

  // Time Distribution calculation
  const distribution = useMemo(() => {
    let prayerSecs = 0;
    let readingSecs = 0;
    let vigilSecs = 0;
    let otherSecs = 0;

    history.forEach(day => {
      if (day.sessions && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          if (s.tag === 'leitura') {
            readingSecs += s.durationSeconds;
          } else if (s.tag === 'despertar' || s.tag === 'noite') {
            vigilSecs += s.durationSeconds;
          } else {
            prayerSecs += s.durationSeconds;
          }
        });
      } else if (day.meditationSeconds > 0) {
        prayerSecs += day.meditationSeconds;
      }

      // habits completed weighted time (assume 5 min of dedication each)
      if (day.habitsCompleted) {
        otherSecs += day.habitsCompleted.length * 5 * 60;
      }
    });

    const totalSeconds = prayerSecs + readingSecs + vigilSecs + otherSecs;
    const totalMin = Math.round(totalSeconds / 60) || 1;

    const pMin = Math.round(prayerSecs / 60);
    const rMin = Math.round(readingSecs / 60);
    const vMin = Math.round(vigilSecs / 60);
    const oMin = Math.round(otherSecs / 60);

    return {
      prayer: { minutes: pMin, percent: Math.round((pMin / totalMin) * 100) },
      reading: { minutes: rMin, percent: Math.round((rMin / totalMin) * 100) },
      vigil: { minutes: vMin, percent: Math.round((vMin / totalMin) * 100) },
      other: { minutes: oMin, percent: Math.round((oMin / totalMin) * 100) },
      totalMinutes: totalMin
    };
  }, [history]);

  // GitHub-style Heatmap Generator
  // Shows a grid of the last 15 weeks (105 days) leading up to today
  const heatmapData = useMemo(() => {
    const totalDays = 105; // 15 weeks
    const today = new Date();
    const list = [];

    // Align start day of the week
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);

      const dayLog = history.find(h => h.date === dateStr);
      const completions = dayLog?.habitsCompleted?.length || 0;
      const meditationMin = Math.round((dayLog?.meditationSeconds || 0) / 60);
      const intensity = completions * 3 + meditationMin; // metric for intensity

      let level = 0;
      if (intensity > 0) {
        if (intensity < 5) level = 1;
        else if (intensity < 15) level = 2;
        else if (intensity < 30) level = 3;
        else level = 4;
      }

      list.push({
        date: dateStr,
        day: d.getDate(),
        dayOfWeek: d.getDay(), // 0 to 6
        completions,
        meditationMin,
        level
      });
    }

    // Split list into 7 rows representing Sun to Sat
    const rows: Array<typeof list> = Array.from({ length: 7 }, () => []);
    list.forEach(item => {
      rows[item.dayOfWeek].push(item);
    });

    return rows;
  }, [history]);

  // Consistency Calendar Offset Calculation
  const calendarDetails = useMemo(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + selectedMonthOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 Sunday, 1 Monday...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    const daysArray = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayLog = history.find(h => h.date === dateStr);
      const completedCount = dayLog?.habitsCompleted?.length || 0;
      const totalPossible = habits.length || 5;
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

  // Smart Summary Analytics
  const smartSummary = useMemo(() => {
    // 1. Best day of week (highest total minutes or completions)
    const dayOfWeekSum: { [dw: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    history.forEach(day => {
      const dateObj = parseLocalDate(day.date);
      const dw = dateObj.getDay();
      const value = (day.habitsCompleted?.length || 0) * 10 + Math.round((day.meditationSeconds || 0) / 60);
      dayOfWeekSum[dw] += value;
    });

    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    let bestDayIdx = 0;
    let maxVal = -1;
    Object.entries(dayOfWeekSum).forEach(([dw, val]) => {
      if (val > maxVal) {
        maxVal = val;
        bestDayIdx = parseInt(dw);
      }
    });

    const bestDay = maxVal > 0 ? dayNames[bestDayIdx] : 'Nenhum registro';

    // 2. Daily average
    const totalDays = history.length || 1;
    const dailyAvgMin = Math.round(totalMeditationMinutes / totalDays);
    const weeklyAvgMin = dailyAvgMin * 7;

    return {
      bestDay,
      dailyAvgMin,
      weeklyAvgMin,
      totalHours: Math.round(totalMeditationMinutes / 60)
    };
  }, [history, totalMeditationMinutes]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <TrendingUp className="text-sky-400 w-6 h-6" />
          Métricas de Perseverança e Foco
        </h2>
        <p className="text-slate-400 text-sm">
          Analise em tempo real sua evolução espiritual, a distribuição do seu tempo e o calendário de assiduidade de orações.
        </p>
      </div>

      {/* KPI Stats Cards - Soft Blue & Green Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Flame className="w-5 h-5 fill-emerald-500/10" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Sequência Atual</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
              {streak} <span className="text-[10px] text-slate-500 font-sans font-normal">dias</span>
            </span>
            <span className="text-[9px] text-slate-500 block">Recorde: {maxStreak}d</span>
          </div>
        </div>

        {/* Total prayer minutes card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Tempo Acumulado</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
              {totalMeditationMinutes} <span className="text-[10px] text-slate-500 font-sans font-normal">min</span>
            </span>
            <span className="text-[9px] text-slate-500 block">Total de {smartSummary.totalHours} horas</span>
          </div>
        </div>

        {/* Completed tasks card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Hábitos Feitos</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
              {totalCompletions} <span className="text-[10px] text-slate-500 font-sans font-normal">vezes</span>
            </span>
            <span className="text-[9px] text-slate-500 block">Práticas espirituais</span>
          </div>
        </div>

        {/* Média Diária */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Média Diária</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
              {smartSummary.dailyAvgMin} <span className="text-[10px] text-slate-500 font-sans font-normal">min</span>
            </span>
            <span className="text-[9px] text-slate-500 block">Semanal: {smartSummary.weeklyAvgMin} min</span>
          </div>
        </div>
      </div>

      {/* Smart Summary Board (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Day Card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dia mais Consagrado</span>
          <div className="mt-2">
            <span className="text-base font-black text-emerald-400 block">{smartSummary.bestDay}</span>
            <p className="text-[10px] text-slate-400 mt-1">Dia da semana com maior intensidade de hábitos e orações acumulados.</p>
          </div>
        </div>

        {/* Média Diária info */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Consistência Semanal</span>
          <div className="mt-2">
            <span className="text-base font-black text-sky-400 block">{smartSummary.weeklyAvgMin} Minutos/semana</span>
            <p className="text-[10px] text-slate-400 mt-1">Dedicação média semanal estimada com base nas sessões gravadas.</p>
          </div>
        </div>

        {/* Total Hours active */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Comunhão Acumulada</span>
          <div className="mt-2">
            <span className="text-base font-black text-emerald-450 block">{smartSummary.totalHours} Horas Totais</span>
            <p className="text-[10px] text-slate-400 mt-1">Horas dedicadas integralmente ao altar de vigília, leitura e meditação.</p>
          </div>
        </div>
      </div>

      {/* Main Analysis Block */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-5">
        
        {/* Navigation subtabs for stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 w-full sm:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveChartSection('evolution')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeChartSection === 'evolution' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gráficos de Evolução
            </button>
            <button
              onClick={() => setActiveChartSection('distribution')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeChartSection === 'distribution' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Distribuição de Tempo
            </button>
            <button
              onClick={() => setActiveChartSection('heatmap')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeChartSection === 'heatmap' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              Intensidade (Heatmap)
            </button>
            <button
              onClick={() => setActiveChartSection('levels')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeChartSection === 'levels' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Níveis e Requisitos
            </button>
          </div>

          {activeChartSection === 'evolution' && (
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setTimeframe('7days')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '7days' ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'text-slate-400'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setTimeframe('15days')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '15days' ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'text-slate-400'
                }`}
              >
                15 Dias
              </button>
              <button
                onClick={() => setTimeframe('30days')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '30days' ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'text-slate-400'
                }`}
              >
                30 Dias
              </button>
            </div>
          )}
        </div>

        {/* Render Chart Panels */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            
            {/* Panel 1: Evolution Charts (Choose one at a time) */}
            {activeChartSection === 'evolution' && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Selector for chart type */}
                <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850 max-w-lg">
                  <button
                    onClick={() => setEvolutionChartType('habits')}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      evolutionChartType === 'habits'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hábitos de Fé
                  </button>
                  <button
                    onClick={() => setEvolutionChartType('prayer')}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      evolutionChartType === 'prayer'
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Tempo em Oração
                  </button>
                  <button
                    onClick={() => setEvolutionChartType('reading')}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      evolutionChartType === 'reading'
                        ? 'bg-indigo-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Tempo em Leitura
                  </button>
                </div>

                {/* Conditional Single Chart */}
                <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-850/60 space-y-5">
                  {evolutionChartType === 'habits' && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs uppercase font-black tracking-wider text-slate-450 block">Hábitos de Fé Concluídos</span>
                          <p className="text-[10px] text-slate-550 mt-0.5">Frequência diária de cumprimento de propósitos devocionais no período</p>
                        </div>
                        <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-lg">
                          Max: {maxCompletions} hábitos/dia
                        </div>
                      </div>

                      <div className="overflow-x-auto pb-2 scrollbar-thin">
                        <div className="h-52 flex items-end gap-1.5 px-1 pt-6 min-w-[420px] md:min-w-0">
                          {chartData.map((d, index) => {
                            const ratio = d.completions > 0 ? (d.completions / maxCompletions) * 100 : 3;
                            return (
                              <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default relative">
                                <div className="w-full bg-slate-900/60 rounded-xl overflow-hidden flex flex-col justify-end h-full relative border border-slate-850/30 group-hover:border-emerald-500/30 transition-colors">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${ratio}%` }}
                                    transition={{ duration: 0.4, delay: index * 0.015 }}
                                    className={`w-full rounded-t-lg ${d.completions > 0 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm' : 'bg-slate-850'}`}
                                  />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500 mt-2.5 truncate text-center max-w-[50px] block leading-tight">
                                  {d.label}
                                </span>
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[9px] font-black px-2 py-1 rounded-xl pointer-events-none z-10 border border-slate-800 shadow-xl">
                                  {d.completions} hábitos
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {evolutionChartType === 'prayer' && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs uppercase font-black tracking-wider text-slate-450 block">Tempo de Vigília e Oração Ativa</span>
                          <p className="text-[10px] text-slate-550 mt-0.5">Minutos dedicados ao altar de comunhão interna e clamores diários</p>
                        </div>
                        <div className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono rounded-lg">
                          Max: {maxPrayerMinutes} min/dia
                        </div>
                      </div>

                      <div className="overflow-x-auto pb-2 scrollbar-thin">
                        <div className="h-52 flex items-end gap-1.5 px-1 pt-6 min-w-[420px] md:min-w-0">
                          {chartData.map((d, index) => {
                            const ratio = d.prayerMinutes > 0 ? (d.prayerMinutes / maxPrayerMinutes) * 100 : 3;
                            return (
                              <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default relative">
                                <div className="w-full bg-slate-900/60 rounded-xl overflow-hidden flex flex-col justify-end h-full relative border border-slate-850/30 group-hover:border-sky-500/30 transition-colors">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${ratio}%` }}
                                    transition={{ duration: 0.4, delay: index * 0.015 }}
                                    className={`w-full rounded-t-lg ${d.prayerMinutes > 0 ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-sm' : 'bg-slate-850'}`}
                                  />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500 mt-2.5 truncate text-center max-w-[50px] block leading-tight">
                                  {d.label}
                                </span>
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[9px] font-black px-2 py-1 rounded-xl pointer-events-none z-10 border border-slate-800 shadow-xl">
                                  {d.prayerMinutes} min
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {evolutionChartType === 'reading' && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs uppercase font-black tracking-wider text-slate-450 block">Tempo de Leitura das Escrituras</span>
                          <p className="text-[10px] text-slate-550 mt-0.5">Minutos sob meditação e leitura da Bíblia Sagrada no período</p>
                        </div>
                        <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono rounded-lg">
                          Max: {maxReadingMinutes} min/dia
                        </div>
                      </div>

                      <div className="overflow-x-auto pb-2 scrollbar-thin">
                        <div className="h-52 flex items-end gap-1.5 px-1 pt-6 min-w-[420px] md:min-w-0">
                          {chartData.map((d, index) => {
                            const ratio = d.readingMinutes > 0 ? (d.readingMinutes / maxReadingMinutes) * 100 : 3;
                            return (
                              <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default relative">
                                <div className="w-full bg-slate-900/60 rounded-xl overflow-hidden flex flex-col justify-end h-full relative border border-slate-850/30 group-hover:border-indigo-500/30 transition-colors">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${ratio}%` }}
                                    transition={{ duration: 0.4, delay: index * 0.015 }}
                                    className={`w-full rounded-t-lg ${d.readingMinutes > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm' : 'bg-slate-850'}`}
                                  />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500 mt-2.5 truncate text-center max-w-[50px] block leading-tight">
                                  {d.label}
                                </span>
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[9px] font-black px-2 py-1 rounded-xl pointer-events-none z-10 border border-slate-800 shadow-xl">
                                  {d.readingMinutes} min
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Panel 2: Time Distribution details (Bento grid stats bars) */}
            {activeChartSection === 'distribution' && (
              <motion.div
                key="distribution"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Distribuição do Tempo de Consagração</span>
                  <p className="text-[9px] text-slate-550">Foco percentual das atividades gravadas em toda sua jornada</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Detailed statistics tracks */}
                  <div className="space-y-4">
                    {/* Oração Contemplativa */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                          Oração Diária / Clamor
                        </span>
                        <span className="text-slate-400 font-mono">
                          {distribution.prayer.minutes} min ({distribution.prayer.percent || 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${distribution.prayer.percent || 0}%` }}
                          className="h-full bg-sky-400 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Leitura Bíblica */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                          Leitura das Escrituras
                        </span>
                        <span className="text-slate-400 font-mono">
                          {distribution.reading.minutes} min ({distribution.reading.percent || 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${distribution.reading.percent || 0}%` }}
                          className="h-full bg-emerald-400 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Vigília Noturna */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                          Vigília e Meditação
                        </span>
                        <span className="text-slate-400 font-mono">
                          {distribution.vigil.minutes} min ({distribution.vigil.percent || 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${distribution.vigil.percent || 0}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Hábitos de fé */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                          Outros Hábitos de Graça (Estimado)
                        </span>
                        <span className="text-slate-400 font-mono">
                          {distribution.other.minutes} min ({distribution.other.percent || 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${distribution.other.percent || 0}%` }}
                          className="h-full bg-slate-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Elegant side summary info card */}
                  <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      Análise de Foco Espiritual
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      O equilíbrio nas disciplinas de fé fortalece a maturidade cristã. A <span className="text-sky-400 font-bold">Oração</span> edifica a presença silenciosa, a <span className="text-emerald-400 font-bold">Leitura</span> traz a clareza e sabedoria, e as <span className="text-blue-500 font-bold">Vigílias</span> consolidam sua persistência frente às provações diárias.
                    </p>
                    <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 font-mono">
                      Dedicação ativa computada: {distribution.totalMinutes} minutos no total.
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Panel 3: GitHub Style Heatmap Grid */}
            {activeChartSection === 'heatmap' && (
              <motion.div
                key="heatmap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Mapa de Calor de Consistência</span>
                  <p className="text-[9px] text-slate-550">Sua assiduidade espiritual diária dos últimos 105 dias (15 semanas)</p>
                </div>

                {/* Heatmap Visual Container with Horizontal Scroll */}
                <div className="overflow-x-auto pb-2 scrollbar-thin">
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-2xl min-w-[560px] md:min-w-0 flex flex-col justify-center">
                    
                    {/* Grid wrapper */}
                    <div className="flex gap-1">
                      
                      {/* Weekday indicators on left */}
                      <div className="flex flex-col justify-between text-[8px] font-black text-slate-600 font-mono pr-2 h-[84px]">
                        <span>Dom</span>
                        <span>Ter</span>
                        <span>Qui</span>
                        <span>Sáb</span>
                      </div>

                      {/* Main squares map */}
                      <div className="flex-1 grid grid-flow-col auto-cols-max gap-1">
                        {heatmapData.map((row, rIdx) => (
                          <React.Fragment key={rIdx}>
                            {row.map((day, dIdx) => {
                              // Color intensity styles matching requested blue/green soft palette
                              let cellBg = 'bg-slate-950 border-slate-900';
                              if (day.level === 1) cellBg = 'bg-emerald-950/30 border-emerald-900/20';
                              else if (day.level === 2) cellBg = 'bg-emerald-900/50 border-emerald-700/20';
                              else if (day.level === 3) cellBg = 'bg-sky-500/25 border-sky-400/20';
                              else if (day.level === 4) cellBg = 'bg-emerald-400 text-slate-950 font-black border-emerald-300';

                              return (
                                <div
                                  key={`${rIdx}-${dIdx}`}
                                  className={`w-2.5 h-2.5 rounded-[2px] border ${cellBg} relative group cursor-help transition-all hover:scale-125`}
                                >
                                  {/* Tooltip detail */}
                                  <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[9px] p-2 rounded-xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-30 w-32 -translate-y-14 -translate-x-12 text-center shadow-2xl">
                                    <p className="font-bold text-slate-200">{day.date}</p>
                                    <p className="text-slate-450 mt-0.5">{day.completions} hábitos</p>
                                    <p className="text-sky-400 font-mono">{day.meditationMin} min oração</p>
                                  </div>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>

                    </div>

                    {/* Legend bar */}
                    <div className="flex items-center justify-end gap-1.5 text-[8px] font-bold text-slate-500 font-mono mt-3.5 pr-2">
                      <span>Menos</span>
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-950 border border-slate-900" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950/30 border-emerald-900/20" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/50 border-emerald-700/20" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-sky-500/25 border-sky-400/20" />
                      <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border-emerald-300" />
                      <span>Mais</span>
                    </div>

                  </div>
                </div>

              </motion.div>
            )}

            {activeChartSection === 'levels' && (
              <LevelsTab profile={profile} history={history} />
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Redesigned Consistency Calendar */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
        
        {/* Calendar Month Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/45 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-200 flex items-center gap-2">
              <Calendar className="text-sky-400 w-5 h-5" />
              Calendário de Assiduidade Espiritual
            </h3>
            <p className="text-[10px] text-slate-500">Mapeamento dos dias com preces, leituras e hábitos sacramentados</p>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 self-end sm:self-auto">
            <button 
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-200 uppercase min-w-[130px] text-center font-mono">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-950/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-950 rounded border border-slate-850 shrink-0" />
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
            <span className="w-3 h-3 bg-gradient-to-br from-emerald-450 to-sky-400 rounded border border-emerald-300 shrink-0" />
            <span>Comunhão Total ⭐</span>
          </div>
        </div>

        {/* Calendar visual layout */}
        <div className="max-w-md mx-auto sm:mx-0 pt-1">
          <div className="grid grid-cols-7 gap-1.5">
            
            {/* Days headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
              <div key={dayName} className="text-center text-[10px] font-black text-slate-500 py-0.5 uppercase tracking-wider font-mono">
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
                  cellStyle = 'bg-gradient-to-tr from-emerald-500 to-sky-500 border-emerald-350 text-slate-950 font-extrabold shadow-sm';
                } else if (isPerfect) {
                  // Gold star: all habits checked
                  cellStyle = 'bg-sky-500 border-sky-400 text-slate-950 font-black';
                } else if (medMin > 0 && completedCount === 0) {
                  // Prayer only
                  cellStyle = 'bg-sky-950/80 border-sky-900/60 text-sky-300 font-semibold';
                } else {
                  // Partial checklist completion
                  const ratio = cell.ratio;
                  if (ratio >= 0.7) {
                    cellStyle = 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold';
                  } else if (ratio >= 0.4) {
                    cellStyle = 'bg-sky-900 text-slate-100 border-sky-700';
                  } else {
                    cellStyle = 'bg-sky-950/40 text-slate-300 border-sky-950';
                  }
                }
              }

              return (
                <div
                  key={`day-${cell.day}`}
                  className={`aspect-square ${cellStyle} rounded-xl flex flex-col items-center justify-center relative cursor-help select-none transition-all border group p-1`}
                >
                  <span className="text-[10px] font-bold font-mono">{cell.day}</span>
                  
                  {isPerfect && (
                    <span className="text-[8px] absolute top-0.5 right-0.5 leading-none">⭐</span>
                  )}

                  {medMin > 0 && !isPerfect && (
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute bottom-1.5" />
                  )}

                  {/* Cell details popup tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] p-2.5 rounded-xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-30 w-32 -translate-y-16 text-center shadow-2xl">
                    <p className="font-bold text-slate-200">{cell.dateStr}</p>
                    <p className="mt-1 text-slate-400 font-sans">{completedCount} de {cell.totalPossible} hábitos</p>
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

      {/* Advice Disclaimer */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-start gap-2 text-slate-500 text-[10px] leading-relaxed">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span>
          O cálculo do Mapa de Calor, Tendências e Estatísticas Inteligentes é processado integralmente em seu dispositivo local, oferecendo uma experiência livre de rastreamento comercial ou vazamento de hábitos devocionais.
        </span>
      </div>

    </motion.div>
  );
}
