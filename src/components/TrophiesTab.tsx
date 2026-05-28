import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Award,
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  Milestone,
  Compass,
  CheckCircle,
  TrendingUp,
  Lock,
  Unlock,
  HeartHandshake
} from 'lucide-react';
import { Habit, DayProgress, Trophy, UserProfile } from '../types';
import { TROPHIES, getLevelTitle, getXPForNextLevel, LEVEL_THRESHOLDS } from '../data/defaultData';

interface TrophiesTabProps {
  key?: string;
  profile: UserProfile;
  habits: Habit[];
  history: DayProgress[];
}

export default function TrophiesTab({ profile, habits, history }: TrophiesTabProps) {
  // We can determine which trophies are unlocked by checking the live user data.
  // Let's compute their progress against requirementType and requirementValue.
  
  // Total completions across all time
  const totalCompletedCount = useMemo(() => {
    return history.reduce((sum, day) => sum + (day.habitsCompleted ? day.habitsCompleted.length : 0), 0);
  }, [history]);

  // Total meditation minutes
  const totalMeditationMinutes = useMemo(() => {
    const totalSecs = history.reduce((sum, day) => sum + (day.meditationSeconds || 0), 0);
    return Math.round(totalSecs / 60);
  }, [history]);

  // Total meditation sessions completed
  const totalMeditationSessions = useMemo(() => {
    return history.filter(day => day.meditationSeconds && day.meditationSeconds > 0).length;
  }, [history]);

  // Prayer specific count
  const prayerCompletedCount = useMemo(() => {
    // ID of prayer habit: 'hb-prayer'
    let count = 0;
    history.forEach(day => {
      if (day.habitsCompleted && day.habitsCompleted.includes('hb-prayer')) {
        count++;
      }
    });
    return count;
  }, [history]);

  // Max streak achieved
  const maxStreakAchieved = profile.maxStreak;

  // Let's calculate the list of trophies with status
  const evaluatedTrophies = useMemo(() => {
    return TROPHIES.map(trophy => {
      let currentValue = 0;
      let unlocked = false;

      switch (trophy.requirementType) {
        case 'total_habits':
          if (trophy.id === 'tr-prayer-centurion') {
            currentValue = prayerCompletedCount;
          } else {
            currentValue = totalCompletedCount;
          }
          unlocked = currentValue >= trophy.requirementValue;
          break;
        case 'streak_days':
          currentValue = maxStreakAchieved;
          unlocked = currentValue >= trophy.requirementValue;
          break;
        case 'reached_level':
          currentValue = profile.level;
          unlocked = currentValue >= trophy.requirementValue;
          break;
        case 'meditation_minutes':
          currentValue = totalMeditationMinutes;
          unlocked = currentValue >= trophy.requirementValue;
          break;
        case 'total_meditations':
          currentValue = totalMeditationSessions;
          unlocked = currentValue >= trophy.requirementValue;
          break;
        default:
          break;
      }

      // Cap progress value at requirements limits
      const progressPercent = Math.min(Math.round((currentValue / trophy.requirementValue) * 105), 100);

      return {
        ...trophy,
        unlocked,
        currentValue,
        progressPercent
      };
    });
  }, [profile, totalCompletedCount, totalMeditationMinutes, totalMeditationSessions, prayerCompletedCount, maxStreakAchieved]);

  // XP Progress Calculation
  const nextLevelXPNeeded = useMemo(() => {
    return getXPForNextLevel(profile.level);
  }, [profile.level]);

  // Find previous threshold so we know the offset
  const previousLevelThreshold = useMemo(() => {
    const current = LEVEL_THRESHOLDS.find(t => t.level === profile.level);
    return current ? current.xpNeeded : 0;
  }, [profile.level]);

  const levelProgressPercent = useMemo(() => {
    const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === profile.level + 1);
    if (!nextLevel) return 100;
    const gainedInThisLevel = profile.xp - previousLevelThreshold;
    const ratio = gainedInThisLevel / nextLevelXPNeeded;
    return Math.min(Math.max(Math.round(ratio * 100), 0), 100);
  }, [profile, previousLevelThreshold, nextLevelXPNeeded]);

  // Number of unlocked medals
  const unlockedCount = useMemo(() => {
    return evaluatedTrophies.filter(t => t.unlocked).length;
  }, [evaluatedTrophies]);

  // Icon mapping helper
  const getIcon = (name: string, isUnlocked: boolean) => {
    const defaultClass = isUnlocked ? 'w-6 h-6 text-amber-400' : 'w-6 h-6 text-slate-600';
    switch (name) {
      case 'Sparkles': return <Sparkles className={defaultClass} />;
      case 'Flame': return <Flame className={defaultClass} />;
      case 'Award': return <Award className={defaultClass} />;
      case 'Clock': return <Clock className={defaultClass} />;
      case 'BookOpen': return <BookOpen className={defaultClass} />;
      case 'Milestone': return <Milestone className={defaultClass} />;
      case 'Compass': return <Compass className={defaultClass} />;
      case 'CheckCircle': return <CheckCircle className={defaultClass} />;
      default: return <Award className={defaultClass} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Tab Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100 flex items-center gap-2">
          <Award className="text-amber-500 w-6 h-6" />
          Conquistas & Espiritualidade
        </h2>
        <p className="text-slate-400 text-sm">
          A perseverança diária fortalece o espírito. Monitore seus trunfos adquiridos e seu patamar evolutivo.
        </p>
      </div>

      {/* Gamified Level Dashboard Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        {/* Decorative ambient visual background */}
        <div className="absolute right-0 top-0 -translate-x-12 translate-y-1 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Level Badge Circle */}
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-indigo-500 p-[2px] flex items-center justify-center shadow-lg shadow-amber-950/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Nível</span>
                <span className="text-2xl font-black text-slate-100 font-mono leading-none">{profile.level}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-amber-400 font-medium px-2 py-0.5 bg-amber-400/10 rounded-full border border-amber-400/20">
                {getLevelTitle(profile.level)}
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                Caminhada de {profile.name || 'Praticante'}
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acumulado total de <span className="font-mono text-slate-200 font-semibold">{profile.xp} XP</span>
              </p>
            </div>
          </div>

          {/* XP Progress and Medals counter details */}
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Progresso do Nível {profile.level}</span>
              <span className="text-slate-200 font-mono font-medium">
                {profile.xp - previousLevelThreshold} / {nextLevelXPNeeded} XP
              </span>
            </div>

            {/* Custom high-contrast progress bar */}
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-indigo-500 rounded-full"
              />
            </div>
            
            <p className="text-[10px] text-slate-500 mt-2 text-right">
              Faltam {nextLevelXPNeeded - (profile.xp - previousLevelThreshold)} XP para o próximo nível espiritual.
            </p>
          </div>
        </div>

        {/* Level Path Info */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-800/60 text-center">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Trunfos Ativos</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{unlockedCount} / {evaluatedTrophies.length}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Registros Ativos</span>
            <span className="text-lg font-bold text-slate-200 font-mono">{totalCompletedCount}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Vigília Total</span>
            <span className="text-lg font-bold text-teal-400 font-mono">{totalMeditationMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Trophies Grid section name */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
          <Award className="w-5 h-5 text-indigo-400" />
          Seus Trunfos e Medalhas
        </h3>
        <p className="text-xs text-slate-400">
          Cada objetivo concluído concede prestígio e sabedoria que retroalimentam seu nível evolutivo.
        </p>
      </div>

      {/* Grid of badges and medals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evaluatedTrophies.map((trophy, index) => (
          <motion.div
            key={trophy.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
              trophy.unlocked 
                ? 'bg-slate-900 border-slate-800 shadow-md shadow-amber-950/5 hover:-translate-y-0.5' 
                : 'bg-slate-900/40 border-slate-900/60 opacity-60'
            }`}
          >
            {/* Status absolute label */}
            <div className="absolute right-3 top-3">
              {trophy.unlocked ? (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                  <Unlock className="w-2.5 h-2.5" /> Adquirida
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850">
                  <Lock className="w-2.5 h-2.5" /> Bloqueada
                </span>
              )}
            </div>

            <div className="flex gap-4 items-center">
              {/* Icon slot container with fun emoji sticker representation */}
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border relative overflow-hidden transition-transform ${
                trophy.unlocked 
                  ? 'bg-gradient-to-br from-amber-500/15 to-indigo-500/15 border-amber-400/40 shadow-inner' 
                  : 'bg-slate-950/60 border-slate-850 opacity-50'
              }`}>
                {/* Decorative retro light aura */}
                {trophy.unlocked && (
                  <span className="absolute inset-x-0 bottom-0 top-0 bg-amber-500/10 blur-sm animate-pulse rounded-full" />
                )}
                
                {trophy.emoji ? (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className={`text-2xl select-none block transition-transform duration-500 ${
                      trophy.unlocked ? 'scale-110 hover:scale-125 hover:rotate-6 active:scale-95 animate-bounce' : 'grayscale filter scale-90'
                    }`} style={{ animationDuration: trophy.unlocked ? '2.5s' : '0s' }}>
                      {trophy.emoji.split(' ')[0]}
                    </span>
                    {trophy.emoji.split(' ')[1] && (
                      <span className="text-[8px] tracking-tight bg-slate-950 px-1 py-0.2 rounded-md font-black text-amber-400 border border-amber-500/20 mt-1 uppercase">
                        {trophy.emoji.split(' ')[1]}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative z-10">
                    {getIcon(trophy.iconName, trophy.unlocked)}
                  </div>
                )}
              </div>

              {/* Reward stats and progress bars */}
              <div className="flex-1 pr-14">
                <h4 className={`font-bold text-sm flex items-center gap-1.5 ${trophy.unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                  {trophy.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {trophy.description}
                </p>

                {/* Progress bar info */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                    <span>Progresso:</span>
                    <span className={trophy.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {trophy.currentValue} / {trophy.requirementValue}
                    </span>
                  </div>
                  
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className={`h-full rounded-full ${trophy.unlocked ? 'bg-amber-400' : 'bg-slate-800'}`}
                      style={{ width: `${trophy.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        ))}
      </div>

      {/* Guide explaining level calculations */}
      <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-300 flex items-center gap-1">
          <HeartHandshake className="w-4 h-4 text-amber-500" />
          Como Funciona o Acúmulo de Experiência (XP)?
        </h4>
        <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
          <li><strong>Hábito Concluído:</strong> Cada hábito individual marcado como feito concede <strong>+15 XP</strong></li>
          <li><strong>Prática no Temporizador:</strong> Cada minuto de meditação ativa concede <strong>+10 XP</strong> por minuto de silêncio.</li>
          <li><strong>Sequência de Perseverança:</strong> Ao atingir a marca diária, você acumula um bônus adicional multiplicador.</li>
          <li><strong>Evolução de Títulos:</strong> Alcançar novos níveis destrava títulos que simbolizam a profundidade de sua disciplina diária.</li>
        </ul>
      </div>

    </motion.div>
  );
}
