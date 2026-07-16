import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Sparkles, 
  Flame, 
  CheckCircle, 
  Award, 
  ChevronRight, 
  Compass, 
  Activity, 
  Info,
  Sliders,
  TrendingUp,
  Heart
} from 'lucide-react';
import { DayProgress, Habit, UserProfile } from '../types';
import { calculateInterestingStats, generateSmartInsights } from '../utils/statsCalculator';

interface StatsTabSummaryProps {
  history: DayProgress[];
  habits: Habit[];
  profile: UserProfile;
}

export default function StatsTabSummary({ history, habits, profile }: StatsTabSummaryProps) {
  // Local state for interactive target slider
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(() => {
    const saved = localStorage.getItem('santuario_meta_diaria');
    return saved ? parseInt(saved, 10) : 90; // Default goal: 90 minutes
  });

  const handleGoalChange = (val: number) => {
    setDailyGoalMinutes(val);
    localStorage.setItem('santuario_meta_diaria', String(val));
  };

  // Get today's stats for the Circular Clock
  const todayProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return history.find(h => h.date === todayStr);
  }, [history]);

  const { todayPrayerMin, todayReadingMin, todayTotalMin, todayCompletedCount } = useMemo(() => {
    let pSecs = 0;
    let rSecs = 0;
    let completedCount = todayProgress?.habitsCompleted?.length || 0;

    if (todayProgress?.sessions && todayProgress.sessions.length > 0) {
      todayProgress.sessions.forEach(s => {
        if (s.tag === 'leitura') rSecs += s.durationSeconds;
        else pSecs += s.durationSeconds;
      });
    } else {
      pSecs += todayProgress?.meditationSeconds || 0;
    }

    const pMin = Math.round(pSecs / 60);
    // If sessions are empty but reading habit is completed, estimate 15 mins for UX smoothness
    const readingHabitCompleted = todayProgress?.habitsCompleted?.some(id => id.includes('reading') || id.includes('biblica') || id.includes('hb-spiritual-reading'));
    const rMin = Math.round(rSecs / 60) || (readingHabitCompleted ? 15 : 0);

    return {
      todayPrayerMin: pMin,
      todayReadingMin: rMin,
      todayTotalMin: pMin + rMin,
      todayCompletedCount: completedCount
    };
  }, [todayProgress]);

  // Circular clock metrics
  const goalRatio = Math.min(todayTotalMin / dailyGoalMinutes, 1);
  const goalPercent = Math.round(goalRatio * 100);
  const strokeDash = 2 * Math.PI * 72; // Radius 72
  const strokeOffset = strokeDash * (1 - goalRatio);

  // 15 Interesting KPIs calculated dynamically
  const kpis = useMemo(() => {
    return calculateInterestingStats(history, habits, profile);
  }, [history, habits, profile]);

  // Smart Insights list
  const insightsList = useMemo(() => {
    const totalPrayerSecs = history.reduce((sum, day) => sum + (day.meditationSeconds || 0), 0);
    const totalReadingSecs = history.reduce((sum, day) => {
      let rSecs = 0;
      day.sessions?.forEach(s => {
        if (s.tag === 'leitura') rSecs += s.durationSeconds;
      });
      return sum + rSecs;
    }, 0);

    return generateSmartInsights(
      history,
      Math.round(totalPrayerSecs / 60),
      Math.round(totalReadingSecs / 60),
      profile.streak,
      habits
    );
  }, [history, habits, profile.streak]);

  // Monthly goals thresholds comparisons (Oração, Leitura, Hábitos, Intercessão)
  const monthlyProgress = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let currentMonthPrayerSecs = 0;
    let currentMonthReadingSecs = 0;
    let monthCompletions = 0;
    let activeDays = 0;

    history.forEach(day => {
      const d = new Date(day.date + 'T12:00:00');
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        monthCompletions += day.habitsCompleted?.length || 0;
        let pSecs = 0;
        let rSecs = 0;
        if (day.sessions && day.sessions.length > 0) {
          day.sessions.forEach(s => {
            if (s.tag === 'leitura') rSecs += s.durationSeconds;
            else pSecs += s.durationSeconds;
          });
        } else {
          pSecs += day.meditationSeconds || 0;
        }
        currentMonthPrayerSecs += pSecs;
        currentMonthReadingSecs += rSecs;
        if (pSecs > 0 || rSecs > 0 || (day.habitsCompleted?.length || 0) > 0) activeDays++;
      }
    });

    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const possibleCompletions = activeDays * habits.length;

    // Check prayer requests list
    let prayerRequestsCount = 0;
    try {
      const stored = localStorage.getItem('santuario_pedidos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) prayerRequestsCount = parsed.length;
      }
    } catch (e) {}

    return [
      {
        id: 'goal-p',
        title: 'Meta de Oração Mensal',
        current: Math.round(currentMonthPrayerSecs / 3600),
        target: 15, // 15 Hours
        unit: 'horas',
        color: 'from-sky-500 to-blue-500'
      },
      {
        id: 'goal-r',
        title: 'Meta de Leitura Mensal',
        current: Math.round(currentMonthReadingSecs / 3600),
        target: 10, // 10 Hours
        unit: 'horas',
        color: 'from-emerald-500 to-teal-500'
      },
      {
        id: 'goal-h',
        title: 'Meta de Frequência de Hábitos',
        current: possibleCompletions > 0 ? Math.round((monthCompletions / possibleCompletions) * 100) : 0,
        target: 80, // 80%
        unit: '%',
        color: 'from-indigo-500 to-purple-500'
      },
      {
        id: 'goal-i',
        title: 'Meta de Clamor e Intercessão',
        current: prayerRequestsCount,
        target: 10, // Orar por 10 pessoas
        unit: 'pessoas',
        color: 'from-amber-500 to-orange-500'
      }
    ];
  }, [history, habits]);

  return (
    <div className="space-y-6">
      
      {/* Top Split: Circular Clock & Goal Control VS Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Card: Circular Clock Dial */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-850 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-[0.02] pointer-events-none">
            <Compass className="w-48 h-48 text-slate-100" />
          </div>

          <div className="text-center space-y-1 w-full border-b border-slate-900 pb-3">
            <span className="text-[9px] uppercase font-bold tracking-widest text-sky-400">Medidor de Consagração</span>
            <h3 className="text-md font-bold text-slate-200">Relógio Circular de Hoje</h3>
          </div>

          {/* Glowing SVG Ring */}
          <div className="my-6 relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              {/* Shadow Base Ring */}
              <circle 
                cx="96" 
                cy="96" 
                r="72" 
                className="stroke-slate-900 fill-transparent stroke-[8]" 
              />
              {/* Dynamic Progress Ring */}
              <motion.circle 
                cx="96" 
                cy="96" 
                r="72" 
                className="stroke-sky-400 fill-transparent stroke-[8] stroke-linecap-round"
                strokeDasharray={strokeDash}
                initial={{ strokeDashoffset: strokeDash }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            
            {/* Centered Numbers */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <motion.span 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black font-mono text-slate-100 leading-none"
              >
                {todayTotalMin}
                <span className="text-xs text-slate-500 font-sans font-normal ml-0.5">min</span>
              </motion.span>
              <span className="text-[10px] text-slate-400 mt-1 font-semibold block">Concluído hoje</span>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded-full mt-2 block">
                {goalPercent}% da Meta
              </span>
            </div>
          </div>

          {/* Goal Interactive Slider */}
          <div className="w-full space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-900">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 uppercase font-black">
                <Sliders className="w-3 h-3 text-sky-400" /> Meta Diária
              </span>
              <span className="text-sky-400 font-mono text-xs">{dailyGoalMinutes} min/dia</span>
            </div>
            
            <input 
              type="range"
              min={15}
              max={180}
              step={15}
              value={dailyGoalMinutes}
              onChange={(e) => handleGoalChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
            />
            
            <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase font-mono">
              <span>15 min</span>
              <span>90 min</span>
              <span>180 min</span>
            </div>
          </div>

        </div>

        {/* Right Card: Smart Insights & Goal Comparison */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Smart Insights Board */}
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-3.5 flex-1 shadow-md">
            <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <Sparkles className="text-sky-400 w-4.5 h-4.5 animate-pulse" />
              Insights Inteligentes e Conselho Devocional
            </h4>
            
            <div className="space-y-2.5">
              {insightsList.map((insight, index) => {
                const isWarning = insight.includes('⚠️');
                const isTrend = insight.includes('📈') || insight.includes('🔥') || insight.includes('🌱') || insight.includes('📚');

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className={`p-3.5 rounded-2xl border flex items-start gap-2.5 leading-relaxed text-xs font-medium ${
                      isWarning
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-350'
                        : isTrend
                          ? 'bg-sky-500/5 border-sky-500/20 text-sky-350'
                          : 'bg-slate-950 border-slate-850 text-slate-300'
                    }`}
                  >
                    <span className="text-sm select-none shrink-0 mt-0.5">
                      {isWarning ? '⚠️' : isTrend ? '✨' : '✝️'}
                    </span>
                    <span>{insight.replace(/^[⚠️📈🔥🌱📚\s✨✝️]+/, '')}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Real-Time Goals Progress Tracks */}
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-3.5 shadow-md">
            <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="text-emerald-400 w-4.5 h-4.5" />
              Metas e Objetivos do Mês Atual
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {monthlyProgress.map(goal => {
                const ratio = Math.min(goal.current / goal.target, 1);
                const percent = Math.round(ratio * 100);

                return (
                  <div key={goal.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900 space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-300 truncate max-w-[130px]">{goal.title}</span>
                      <span className="text-slate-500 font-mono">
                        <span className="text-slate-300 font-bold">{goal.current}</span> / {goal.target} {goal.unit}
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-950 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${goal.color}`}
                        transition={{ duration: 0.6 }}
                      />
                    </div>

                    <div className="flex justify-between text-[8px] font-mono font-bold text-slate-550">
                      <span>Metas</span>
                      <span className={percent === 100 ? 'text-emerald-400' : 'text-sky-400'}>
                        {percent}% Concluído
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 15 Dynamic Spiritual KPIs Bento Grid */}
      <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="text-sky-400 w-4.5 h-4.5" />
          <div>
            <h3 className="font-bold text-sm text-slate-200">Painel Geral de Indicadores de Fé</h3>
            <p className="text-[10px] text-slate-500">Mapeamento dinâmico de 15 métricas espirituais extraídas do seu histórico</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((kpi, index) => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              key={kpi.label}
              className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900/60 flex flex-col justify-between hover:border-slate-800 transition-all select-none"
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider line-clamp-1">
                {kpi.label}
              </span>
              <div className="mt-2.5">
                <span className="text-md font-black font-mono text-sky-400 block tracking-tight truncate">
                  {kpi.value}
                </span>
                <p className="text-[8px] text-slate-500 font-sans mt-0.5 line-clamp-2 leading-tight">
                  {kpi.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
