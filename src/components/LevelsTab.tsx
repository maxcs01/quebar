import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Compass, 
  ShieldCheck, 
  BookOpen, 
  Clock, 
  Flame, 
  TrendingUp,
  ChevronRight,
  Shield,
  Zap,
  Check
} from 'lucide-react';
import { UserProfile, DayProgress } from '../types';
import { LEVEL_THRESHOLDS, getLevelTitle, getXPForNextLevel } from '../data/defaultData';

interface LevelsTabProps {
  profile: UserProfile;
  history: DayProgress[];
}

export default function LevelsTab({ profile, history }: LevelsTabProps) {
  const currentXP = profile.xp;
  const currentLevel = profile.level;

  // Calculate stats
  const totalHabits = useMemo(() => {
    return history.reduce((acc, d) => acc + (d.habitsCompleted?.length || 0), 0);
  }, [history]);

  const totalMedMinutes = useMemo(() => {
    return Math.floor(history.reduce((acc, d) => acc + (d.meditationSeconds || 0), 0) / 60);
  }, [history]);

  // Next level threshold object
  const nextLevelThreshold = useMemo(() => {
    const nextLvl = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
    return nextLvl || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  }, [currentLevel]);

  const currentLevelThreshold = useMemo(() => {
    const curr = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
    return curr ? curr.xpNeeded : 0;
  }, [currentLevel]);

  const xpInCurrentLevel = currentXP - currentLevelThreshold;
  const xpNeededForNext = getXPForNextLevel(currentLevel);

  // General XP progress percent
  const progressPercent = useMemo(() => {
    if (currentLevel >= 50) return 100;
    const ratio = xpInCurrentLevel / xpNeededForNext;
    return Math.min(Math.max(Math.round(ratio * 100), 0), 100);
  }, [xpInCurrentLevel, xpNeededForNext, currentLevel]);

  // Determine if requirements are met for a level
  const isLevelUnlocked = (lvl: typeof LEVEL_THRESHOLDS[0]) => {
    return currentXP >= lvl.xpNeeded && 
           Math.max(profile.streak, profile.maxStreak) >= (lvl.reqStreak || 0) &&
           totalHabits >= (lvl.reqHabits || 0) &&
           totalMedMinutes >= (lvl.reqMedMinutes || 0);
  };

  const getLevelReward = (level: number) => {
    if (level === 1) return "Acesso ao Altar de Intercessão (Pedidos de Oração)";
    if (level === 2) return "Cronômetro de Vigília Personalizado";
    if (level === 3) return "Medalha de Sentinela da Fé + Avatar Personalizado";
    if (level === 4) return "Iniciação em Exame de Consciência Noturno Avançado";
    if (level === 5) return "Ativação de Relatório e Análise de Hábitos Semanais";
    if (level === 6) return "Título 'Devoto Fiel' + Trunfos de Consistência Premium";
    if (level === 7) return "Som de Gongo Budista e Tigela Tibetana no Cronômetro";
    if (level === 8) return "Exportação de Diários de Reflexão Espiritual em Texto";
    if (level === 9) return "Tema Visual Exclusivo 'Farol de Luz' (Contraste Máximo)";
    if (level === 10) return "Selo de Glória do Templo 'Testemunha da Luz'";
    if (level <= 15) return `Aura de Foco Nível ${level} + Multiplicador de Frequência`;
    if (level <= 20) return `Selo de Guardião da Fé + 10% de Bônus de Clamor`;
    if (level <= 30) return `Insígnia Sagrada de Sentinela Nível ${level}`;
    if (level <= 40) return `Graça Divina Amplificada + Medalha do Templo`;
    return `Soberania Espiritual Máxima (Nível ${level})`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Award className="text-sky-400 w-6 h-6" />
          Níveis e Progressão Espiritual (1 a 50)
        </h2>
        <p className="text-slate-400 text-sm">
          Acompanhe sua caminhada cristã e a evolução da sua perseverança na fé. Agora, para avançar, você precisa atender a múltiplos requisitos de consagração e não apenas acumular XP!
        </p>
      </div>

      {/* Main visual summary of Current Level */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-x-10 translate-y-1 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Circular Level Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 via-emerald-400 to-sky-600 p-[2px] flex items-center justify-center shadow-xl shadow-sky-950/20 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-[9px] text-sky-400 font-extrabold uppercase tracking-wider leading-none">Nível</span>
                <span className="text-3xl font-black text-slate-100 font-mono mt-0.5 leading-none">{currentLevel}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-sky-400 font-black px-3 py-1 bg-sky-500/10 rounded-full border border-sky-500/20 uppercase tracking-wider">
                {getLevelTitle(currentLevel)}
              </span>
              <h3 className="text-lg font-bold text-slate-150 mt-2.5 flex items-center gap-2">
                Caminhada de {profile.name}
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Você acumulou <span className="font-mono text-slate-200 font-bold">{currentXP} XP</span> desde o início de sua consagração.
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                Progresso para o Nível {currentLevel >= 50 ? 50 : currentLevel + 1}
              </span>
              <span className="text-slate-200 font-mono font-bold">
                {currentLevel >= 50 ? 'Nível Máximo' : `${xpInCurrentLevel} / ${xpNeededForNext} XP`}
              </span>
            </div>

            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-905">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
              />
            </div>
            
            {currentLevel < 50 && (
              <p className="text-[10px] text-slate-500 mt-2 text-right">
                Faltam <strong className="text-sky-400 font-mono">{xpNeededForNext - xpInCurrentLevel} XP</strong> para sua próxima ascensão.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Bento-style Card of requirements for the NEXT level */}
      {currentLevel < 50 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div>
            <span className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Desafio Ativo</span>
            <h3 className="text-sm font-bold text-slate-200 mt-0.5">Requisitos exigidos para ascender ao Nível {currentLevel + 1} ({getLevelTitle(currentLevel + 1)}):</h3>
            <p className="text-xs text-slate-400">Você deve cumprir todos os requisitos abaixo de forma cumulativa para liberar o próximo nível.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* XP requirement */}
            <div className={`p-4 rounded-2xl border ${
              currentXP >= nextLevelThreshold.xpNeeded 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-slate-950/60 border-slate-850'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Experiência (XP)</span>
                {currentXP >= nextLevelThreshold.xpNeeded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>
              <div className="text-lg font-black font-mono text-slate-200">
                {currentXP} <span className="text-xs font-normal text-slate-500">/ {nextLevelThreshold.xpNeeded} XP</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  style={{ width: `${Math.min(100, (currentXP / nextLevelThreshold.xpNeeded) * 100)}%` }} 
                  className={`h-full ${currentXP >= nextLevelThreshold.xpNeeded ? 'bg-emerald-400' : 'bg-sky-450'}`} 
                />
              </div>
            </div>

            {/* Streak requirement */}
            <div className={`p-4 rounded-2xl border ${
              Math.max(profile.streak, profile.maxStreak) >= (nextLevelThreshold.reqStreak || 0)
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-slate-950/60 border-slate-850'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Fidelidade diária</span>
                {Math.max(profile.streak, profile.maxStreak) >= (nextLevelThreshold.reqStreak || 0) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>
              <div className="text-lg font-black font-mono text-slate-200">
                {Math.max(profile.streak, profile.maxStreak)} <span className="text-xs font-normal text-slate-500">/ {nextLevelThreshold.reqStreak || 0} dias (Melhor)</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  style={{ width: `${(nextLevelThreshold.reqStreak || 0) > 0 ? Math.min(100, (Math.max(profile.streak, profile.maxStreak) / (nextLevelThreshold.reqStreak || 1)) * 100) : 100}%` }} 
                  className={`h-full ${Math.max(profile.streak, profile.maxStreak) >= (nextLevelThreshold.reqStreak || 0) ? 'bg-emerald-400' : 'bg-sky-450'}`} 
                />
              </div>
            </div>

            {/* Habits requirement */}
            <div className={`p-4 rounded-2xl border ${
              totalHabits >= (nextLevelThreshold.reqHabits || 0)
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-slate-950/60 border-slate-850'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Hábitos Completos</span>
                {totalHabits >= (nextLevelThreshold.reqHabits || 0) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>
              <div className="text-lg font-black font-mono text-slate-200">
                {totalHabits} <span className="text-xs font-normal text-slate-500">/ {nextLevelThreshold.reqHabits || 0} completados</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  style={{ width: `${(nextLevelThreshold.reqHabits || 0) > 0 ? Math.min(100, (totalHabits / (nextLevelThreshold.reqHabits || 1)) * 100) : 100}%` }} 
                  className={`h-full ${totalHabits >= (nextLevelThreshold.reqHabits || 0) ? 'bg-emerald-400' : 'bg-sky-450'}`} 
                />
              </div>
            </div>

            {/* Prayer minutes requirement */}
            <div className={`p-4 rounded-2xl border ${
              totalMedMinutes >= (nextLevelThreshold.reqMedMinutes || 0)
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-slate-950/60 border-slate-850'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tempo de Vigília</span>
                {totalMedMinutes >= (nextLevelThreshold.reqMedMinutes || 0) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>
              <div className="text-lg font-black font-mono text-slate-200">
                {totalMedMinutes} <span className="text-xs font-normal text-slate-500">/ {nextLevelThreshold.reqMedMinutes || 0} min</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  style={{ width: `${(nextLevelThreshold.reqMedMinutes || 0) > 0 ? Math.min(100, (totalMedMinutes / (nextLevelThreshold.reqMedMinutes || 1)) * 100) : 100}%` }} 
                  className={`h-full ${totalMedMinutes >= (nextLevelThreshold.reqMedMinutes || 0) ? 'bg-emerald-400' : 'bg-sky-450'}`} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of full levels progression & Rewards unlocked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Level List Thresholds - Left / 2 cols */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              Tabela de Níveis (1 a 50) e Distintivos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Confira os requisitos acumulados necessários para conquistar cada degrau da maturidade espiritual.
            </p>
          </div>

          <div className="divide-y divide-slate-850/60 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
            {LEVEL_THRESHOLDS.map((lvl) => {
              const isUnlocked = isLevelUnlocked(lvl);
              const isCurrent = currentLevel === lvl.level;

              return (
                <div 
                  key={lvl.level}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isCurrent ? 'bg-sky-500/5 -mx-2 px-2 rounded-xl border border-sky-500/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                      isCurrent 
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' 
                        : isUnlocked 
                        ? 'bg-slate-950 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-950/60 text-slate-600 border border-slate-900'
                    }`}>
                      {lvl.level}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${
                          isCurrent 
                            ? 'text-sky-400 font-black' 
                            : isUnlocked 
                            ? 'text-slate-200' 
                            : 'text-slate-500'
                        }`}>
                          {lvl.title}
                        </span>
                        {isUnlocked && !isCurrent && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>

                      {/* Micro requirement tags showing progress */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* XP Tag */}
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border ${
                          currentXP >= lvl.xpNeeded 
                            ? 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10' 
                            : 'bg-slate-950 text-slate-500 border-slate-900'
                        }`}>
                          XP: {lvl.xpNeeded}
                        </span>

                        {/* Streak tag */}
                        {lvl.reqStreak && lvl.reqStreak > 0 ? (
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border ${
                            Math.max(profile.streak, profile.maxStreak) >= lvl.reqStreak 
                              ? 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10' 
                              : 'bg-slate-950 text-slate-500 border-slate-900'
                          }`}>
                            Seq: {lvl.reqStreak}d
                          </span>
                        ) : null}

                        {/* Habits tag */}
                        {lvl.reqHabits && lvl.reqHabits > 0 ? (
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border ${
                            totalHabits >= lvl.reqHabits 
                              ? 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10' 
                              : 'bg-slate-950 text-slate-500 border-slate-900'
                          }`}>
                            Hábitos: {lvl.reqHabits}
                          </span>
                        ) : null}

                        {/* Meditation minutes tag */}
                        {lvl.reqMedMinutes && lvl.reqMedMinutes > 0 ? (
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border ${
                            totalMedMinutes >= lvl.reqMedMinutes 
                              ? 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10' 
                              : 'bg-slate-950 text-slate-500 border-slate-900'
                          }`}>
                            Vigília: {lvl.reqMedMinutes}m
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isCurrent ? (
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">
                        Atual
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        Liberado
                      </span>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1 text-[10px] font-bold font-mono">
                        <Lock className="w-3 h-3" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards unlocked side list */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Virtudes e Recompensas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Facilidades de interface, sons devocionais e distintivos de honra obtidos na sua ascensão espiritual.
              </p>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {LEVEL_THRESHOLDS.slice(0, 25).map((lvl) => {
                const isUnlocked = isLevelUnlocked(lvl);

                return (
                  <div 
                    key={lvl.level}
                    className={`p-3 rounded-xl border flex gap-3 items-start transition-all ${
                      isUnlocked 
                        ? 'bg-slate-950/70 border-emerald-500/15' 
                        : 'bg-slate-950/20 border-slate-900 opacity-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isUnlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'
                    }`}>
                      {lvl.level <= 3 ? <Clock className="w-3.5 h-3.5" /> : lvl.level <= 6 ? <BookOpen className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${
                        isUnlocked ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        Nível {lvl.level} • {lvl.title}
                      </span>
                      <p className={`text-[11px] leading-snug ${
                        isUnlocked ? 'text-slate-300 font-semibold' : 'text-slate-500'
                      }`}>
                        {getLevelReward(lvl.level)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="text-center p-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-t border-slate-850">
                Mais graças aguardam até o Nível 50
              </div>
            </div>
          </div>

          {/* Inspirational guide to XP */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 text-center">
            <span className="text-[10px] text-sky-400 block font-bold uppercase tracking-wider mb-1">Como colher Graça (XP)?</span>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-medium">
              <div className="p-1.5 bg-slate-900 rounded-lg">Completar Hábito: <span className="text-emerald-400 font-bold font-mono block text-[10px] mt-0.5">+15 XP</span></div>
              <div className="p-1.5 bg-slate-900 rounded-lg">Minuto de Oração: <span className="text-emerald-400 font-bold font-mono block text-[10px] mt-0.5">+10 XP</span></div>
              <div className="p-1.5 bg-slate-900 rounded-lg">Escrever Diário: <span className="text-emerald-400 font-bold font-mono block text-[10px] mt-0.5">+10 XP</span></div>
              <div className="p-1.5 bg-slate-900 rounded-lg">Reativar Oração: <span className="text-emerald-400 font-bold font-mono block text-[10px] mt-0.5">+5 XP</span></div>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
