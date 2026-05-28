import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Play, 
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Habit, DayProgress } from '../types';

interface StatsTabProps {
  key?: string;
  habits: Habit[];
  history: DayProgress[];
  streak: number;
  maxStreak: number;
}

export default function StatsTab({ habits, history, streak, maxStreak }: StatsTabProps) {
  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  // Helper date generators
  const getPastDates = (days: number) => {
    const list: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      list.push(`${yyyy}-${mm}-${dd}`);
    }
    return list;
  };

  const periodDates = useMemo(() => {
    return timeframe === '7days' ? getPastDates(7) : getPastDates(30);
  }, [timeframe]);

  // Statistics calculations
  const totalMeditationSeconds = useMemo(() => {
    return history.reduce((sum, day) => sum + (day.meditationSeconds || 0), 0);
  }, [history]);

  const totalCompletedHabitsCount = useMemo(() => {
    return history.reduce((sum, day) => sum + (day.habitsCompleted ? day.habitsCompleted.length : 0), 0);
  }, [history]);

  // Grouped by category
  const categoryStats = useMemo(() => {
    const stats = {
      meditation: 0,
      spiritual: 0,
      reading: 0,
      reflection: 0,
      gratitude: 0,
    };
    
    // Create habit-to-category map
    const habitCategoryMap: { [key: string]: string } = {};
    habits.forEach(h => {
      habitCategoryMap[h.id] = h.category;
    });

    history.forEach(day => {
      if (day.habitsCompleted) {
        day.habitsCompleted.forEach(id => {
          const category = habitCategoryMap[id] as keyof typeof stats;
          if (category && stats[category] !== undefined) {
            stats[category] += 1;
          }
        });
      }
    });

    return stats;
  }, [habits, history]);

  const totalMeditationMinutesSum = Math.round(totalMeditationSeconds / 60);

  // Data for the charts
  const chartData = useMemo(() => {
    return periodDates.map(dateStr => {
      const formattedDay = new Date(dateStr);
      const label = timeframe === '7days' 
        ? formattedDay.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        : formattedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });

      const dayLog = history.find(h => h.date === dateStr);
      const habitsCount = dayLog?.habitsCompleted?.length || 0;
      const meditationMin = Math.round((dayLog?.meditationSeconds || 0) / 60);

      const maxPossibleHabits = habits.length || 1;
      const completionRate = Math.round((habitsCount / maxPossibleHabits) * 100);

      return {
        date: dateStr,
        label,
        completions: habitsCount,
        percent: completionRate,
        meditationMinutes: meditationMin
      };
    });
  }, [periodDates, history, habits, timeframe]);

  // Dynamic grid (monthly grid like contribution map) for the selected month offset
  const gridMonthDetails = useMemo(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + selectedMonthOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday etc
    
    // Number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthLabel = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    const daysArray = [];
    // Pad previous month's days empty
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLog = history.find(h => h.date === dateStr);
      const completionsCount = dayLog?.habitsCompleted?.length || 0;
      const totalPossible = habits.length || 1;
      const ratio = totalPossible > 0 ? completionsCount / totalPossible : 0;
      
      daysArray.push({
        day,
        dateStr,
        completionsCount,
        ratio,
        meditationSeconds: dayLog?.meditationSeconds || 0
      });
    }
    
    return {
      monthLabel,
      daysArray,
      year,
      month
    };
  }, [selectedMonthOffset, history, habits]);

  // Finding max values for Chart scale
  const maxCompletionsInPeriod = Math.max(...chartData.map(d => d.completions), 1);
  const maxMeditationMinInPeriod = Math.max(...chartData.map(d => d.meditationMinutes), 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingUp className="text-amber-500 w-6 h-6" />
          Estatísticas & Progresso
        </h2>
        <p className="text-slate-400 text-sm">
          Acompanhe o ritmo de suas práticas, sequências de perseverança espiritual e horas sob atenção plena.
        </p>
      </div>

      {/* Grid containing Highlight KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sequence Stat card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Flame className="w-24 h-24 text-amber-500" />
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sequência Atual</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100 font-mono">{streak}</span>
              <span className="text-xs text-slate-400">dias seguidos</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Recorde: {maxStreak} dias</p>
          </div>
        </div>

        {/* Meditation Hours Stat card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Clock className="w-24 h-24 text-teal-400" />
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Minutos de Oração/Meditação</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100 font-mono">{totalMeditationMinutesSum}</span>
              <span className="text-xs text-slate-400">min totais</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Concluídos via temporizador</p>
          </div>
        </div>

        {/* Habits Total card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <CheckCircle2 className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Trunfos e Tarefas</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100 font-mono">{totalCompletedHabitsCount}</span>
              <span className="text-xs text-slate-400">conclusões</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Total de hábitos realizados</p>
          </div>
        </div>

        {/* Freq stat card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5">
            <Calendar className="w-24 h-24 text-rose-400" />
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Frequência Semanal</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {history.length > 0 ? Math.round((history.filter(h => h.habitsCompleted.length > 0).length / Math.max(history.length, 1)) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-400">fidelidade ao plano</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Dias com prática preenchida</p>
          </div>
        </div>
      </div>

      {/* Tabs configuration to switch graph timeframes (7 days or 30 days) */}
      <div className="bg-slate-950/40 p-1 rounded-lg flex items-center justify-between border border-slate-900">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pl-2">Gráficos de Atividade</h3>
        <div className="flex bg-slate-900/80 p-0.5 rounded-md border border-slate-800">
          <button
            id="btn-tf-7days"
            onClick={() => setTimeframe('7days')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${timeframe === '7days' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            7 dias
          </button>
          <button
            id="btn-tf-30days"
            onClick={() => setTimeframe('30days')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${timeframe === '30days' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Completion Bar Chart (SVG) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Hábitos Concluídos
            </h4>
            <div className="text-[11px] text-slate-400 mb-4 h-3 flex justify-between">
              <span>Quantidade de hábitos marcados</span>
              <span className="font-mono text-[9px]">Escala máxima: {maxCompletionsInPeriod}</span>
            </div>
          </div>

          <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 pt-4 px-1">
            {chartData.map((d, index) => {
              const heightPercent = d.completions > 0 
                ? (d.completions / maxCompletionsInPeriod) * 100 
                : 3; // tiny height for visibility of zero
              return (
                <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 bg-slate-950 text-slate-100 text-[10px] px-2 py-1 rounded absolute transform -translate-y-24 transition-all z-10 pointer-events-none border border-slate-800 text-center font-mono">
                    <p className="font-semibold">{d.completions} {d.completions === 1 ? 'hábito' : 'hábitos'}</p>
                    <p className="text-slate-400 text-[9px]">{d.date}</p>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-slate-950 rounded-md overflow-hidden flex flex-col justify-end h-[85%] relative border border-slate-850">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.02 }}
                      className={`w-full rounded-t-sm ${d.completions > 0 ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-amber-400' : 'bg-slate-850'}`}
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[9px] font-mono text-slate-400 mt-2 text-center overflow-hidden w-full text-ellipsis whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meditation Line Chart (SVG) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-teal-400" />
              Tempo de Silêncio e Oração (min)
            </h4>
            <div className="text-[11px] text-slate-400 mb-4 h-3 flex justify-between">
              <span>Minutos acumulados no cronômetro</span>
              <span className="font-mono text-[9px]">Escala máxima: {maxMeditationMinInPeriod} min</span>
            </div>
          </div>

          <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 pt-4 px-1">
            {chartData.map((d, index) => {
              const heightPercent = d.meditationMinutes > 0 
                ? (d.meditationMinutes / maxMeditationMinInPeriod) * 100 
                : 3;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end cursor-default">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 bg-slate-950 text-slate-100 text-[10px] px-2 py-1 rounded absolute transform -translate-y-24 transition-all z-10 pointer-events-none border border-slate-800 text-center font-mono">
                    <p className="font-semibold text-teal-400">{d.meditationMinutes} min</p>
                    <p className="text-slate-400 text-[9px]">{d.date}</p>
                  </div>

                  {/* Bar representing meditation mins */}
                  <div className="w-full bg-slate-950 rounded-md overflow-hidden flex flex-col justify-end h-[85%] relative border border-slate-850">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.02 }}
                      className={`w-full rounded-t-sm ${d.meditationMinutes > 0 ? 'bg-gradient-to-t from-teal-700 via-teal-500 to-emerald-300' : 'bg-slate-850'}`}
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[9px] font-mono text-slate-400 mt-2 text-center overflow-hidden w-full text-ellipsis whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contribution Grid / Spiritual Heatmap */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Calendário de Devoção
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Visualização de assiduidade diária</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-850">
            <button 
              id="btn-offset-prev"
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-200 uppercase min-w-[130px] text-center">
              {gridMonthDetails.monthLabel}
            </span>
            <button 
              id="btn-offset-next"
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mb-4 bg-slate-950/40 p-2 rounded-lg border border-slate-950">
          <span className="font-semibold text-slate-300">Intensidade (Hábitos realizados):</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-950 rounded border border-slate-800" title="Sem atividades"></span>
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-indigo-950 rounded border border-slate-800" title="Pouco ativo"></span>
            <span>Até 30%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-indigo-800 rounded border border-slate-700" title="Regular"></span>
            <span>Até 60%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-indigo-500 rounded border border-indigo-400" title="Muito ativo"></span>
            <span>Até 90%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-500 rounded border border-amber-300" title="Plena devoção"></span>
            <span>100%</span>
          </div>
        </div>

        {/* Main Grid display */}
        <div className="grid grid-cols-7 gap-1.5 max-w-md mx-auto sm:mx-0">
          {/* Weekday headers Portuguese representation */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
            <div key={dayName} className="text-center text-[10px] font-medium text-slate-500 py-1 font-mono">
              {dayName}
            </div>
          ))}

          {/* Grid Cells */}
          {gridMonthDetails.daysArray.map((dayObj, index) => {
            if (!dayObj) {
              return <div key={`empty-${index}`} className="aspect-square bg-transparent rounded-lg"></div>;
            }

            // Calculate style depending on completionsRatio
            let bgClass = 'bg-slate-950 border-slate-850 hover:border-slate-700';
            let textClass = 'text-slate-400';
            
            if (dayObj.completionsCount > 0) {
              textClass = 'text-slate-100 font-bold';
              const ratio = dayObj.ratio;
              if (ratio === 1) {
                bgClass = 'bg-amber-500 text-slate-950 border-amber-300 font-bold';
              } else if (ratio >= 0.7) {
                bgClass = 'bg-indigo-500 text-slate-100 border-indigo-400 font-bold';
              } else if (ratio >= 0.4) {
                bgClass = 'bg-indigo-800 text-slate-200 border-indigo-600';
              } else {
                bgClass = 'bg-indigo-950 text-slate-300 border-slate-800';
              }
            }

            return (
              <div
                key={`day-${dayObj.day}`}
                className={`aspect-square ${bgClass} rounded-lg flex flex-col items-center justify-center relative cursor-help transition-all group p-1 border`}
              >
                <span className="text-[10px] font-mono">{dayObj.day}</span>
                
                {/* Indicator dot if they meditated that day */}
                {dayObj.meditationSeconds > 0 && (
                  <span className={`w-1 h-1 rounded-full absolute bottom-1 ${dayObj.ratio === 1 ? 'bg-slate-950' : 'bg-teal-400'}`} />
                )}

                {/* Grid tooltip on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] p-2 rounded-xl scale-0 group-hover:scale-100 transition-all pointer-events-none z-20 w-32 -translate-y-16 text-center shadow-xl">
                  <p className="font-bold text-slate-200">{dayObj.dateStr}</p>
                  <p className="mt-1 text-slate-400">{dayObj.completionsCount} hábitos realizados</p>
                  {dayObj.meditationSeconds > 0 && (
                    <p className="text-teal-400 font-mono mt-0.5">{Math.round(dayObj.meditationSeconds / 60)} min oração</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown stats list */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-4">
          <Award className="w-4 h-4 text-emerald-400" />
          Foco das Suas Práticas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-400 block mb-1">Oração Silenciosa</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{categoryStats.meditation}</span>
            <span className="text-[10px] text-slate-500 block">vezes concluído</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-400 block mb-1">Preces e Devocional</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{categoryStats.spiritual}</span>
            <span className="text-[10px] text-slate-500 block">vezes concluído</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-400 block mb-1">Leitura Bíblica</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{categoryStats.reading}</span>
            <span className="text-[10px] text-slate-500 block">vezes concluído</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-400 block mb-1">Gratidão Cristã</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{categoryStats.gratitude}</span>
            <span className="text-[10px] text-slate-500 block">vezes concluído</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-400 block mb-1">Exame de Consciência</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{categoryStats.reflection}</span>
            <span className="text-[10px] text-slate-500 block">vezes concluído</span>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
