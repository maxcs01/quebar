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
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { LEVEL_THRESHOLDS, getLevelTitle, getXPForNextLevel } from '../data/defaultData';

interface LevelsTabProps {
  profile: UserProfile;
}

export default function LevelsTab({ profile }: LevelsTabProps) {
  const currentXP = profile.xp;
  const currentLevel = profile.level;

  // Calculate stats
  const nextLevelThreshold = useMemo(() => {
    const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
    return nextLevel ? nextLevel.xpNeeded : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xpNeeded;
  }, [currentLevel]);

  const currentLevelThreshold = useMemo(() => {
    const curr = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
    return curr ? curr.xpNeeded : 0;
  }, [currentLevel]);

  const xpInCurrentLevel = currentXP - currentLevelThreshold;
  const xpNeededForNext = getXPForNextLevel(currentLevel);

  const progressPercent = useMemo(() => {
    if (currentLevel >= 10) return 100;
    const ratio = xpInCurrentLevel / xpNeededForNext;
    return Math.min(Math.max(Math.round(ratio * 100), 0), 100);
  }, [xpInCurrentLevel, xpNeededForNext, currentLevel]);

  // Rewards linked to levels
  const getLevelReward = (level: number) => {
    switch (level) {
      case 1: return "Acesso ao Altar de Intercessão (Pedidos de Oração)";
      case 2: return "Cronômetro de Vigília Personalizado";
      case 3: return "Medalha de Sentinela da Fé + Avatar Personalizado";
      case 4: return "Iniciação em Exame de Consciência Noturno Avançado";
      case 5: return "Ativação de Relatório e Análise de Hábitos Semanais";
      case 6: return "Título 'Devoto Fiel' + Trunfos de Consistência Premium";
      case 7: return "Som de Gongo Budista e Tigela Tibetana no Cronômetro";
      case 8: return "Exportação de Diários de Reflexão Espiritual em Texto";
      case 9: return "Tema Visual Exclusivo 'Farol de Luz' (Contraste Máximo)";
      case 10: return "Selo de Glória do Templo 'Testemunha da Luz'";
      default: return "Novas medalhas espirituais desbravadas";
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
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Award className="text-sky-400 w-6 h-6" />
          Níveis e Progressão Espiritual
        </h2>
        <p className="text-slate-400 text-sm">
          Acompanhe sua caminhada cristã e a evolução da sua perseverança na fé. Cada hábito diário e oração completada gera graça divina (XP) para elevar seu nível.
        </p>
      </div>

      {/* Main visual summary of Current Level */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-x-10 translate-y-1 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Circular Level Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 via-emerald-400 to-sky-600 p-[2px] flex items-center justify-center shadow-xl shadow-sky-950/20">
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
                Progresso para o Nível {currentLevel >= 10 ? 10 : currentLevel + 1}
              </span>
              <span className="text-slate-200 font-mono font-bold">
                {currentLevel >= 10 ? 'Nível Máximo' : `${xpInCurrentLevel} / ${xpNeededForNext} XP`}
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
            
            {currentLevel < 10 && (
              <p className="text-[10px] text-slate-500 mt-2 text-right">
                Faltam <strong className="text-sky-400 font-mono">{xpNeededForNext - xpInCurrentLevel} XP</strong> para sua próxima ascensão.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Grid of full levels progression & Rewards unlocked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Level List Thresholds - Left / 2 cols */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              Tabela de Níveis e Distintivos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Confira todos os estágios da jornada cristã de aperfeiçoamento espiritual e fidelidade.
            </p>
          </div>

          <div className="divide-y divide-slate-850/60 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {LEVEL_THRESHOLDS.map((lvl) => {
              const isUnlocked = currentXP >= lvl.xpNeeded;
              const isCurrent = currentLevel === lvl.level;

              return (
                <div 
                  key={lvl.level}
                  className={`py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isCurrent ? 'bg-sky-500/5 -mx-2 px-2 rounded-xl border border-sky-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                      isCurrent 
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' 
                        : isUnlocked 
                        ? 'bg-slate-950 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-950/60 text-slate-600 border border-slate-900'
                    }`}>
                      {lvl.level}
                    </div>

                    <div className="min-w-0">
                      <span className={`text-xs block font-bold truncate ${
                        isCurrent 
                          ? 'text-sky-400 font-black' 
                          : isUnlocked 
                          ? 'text-slate-200' 
                          : 'text-slate-500'
                      }`}>
                        {lvl.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {lvl.xpNeeded} XP necessário
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">
                        Atual
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        Conquistado
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
                Graças e Recompensas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Novas virtudes espirituais e facilidades do app desbloqueadas ao evoluir sua persistência.
              </p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {LEVEL_THRESHOLDS.map((lvl) => {
                const isUnlocked = currentLevel >= lvl.level;

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
            </div>
          </div>

          {/* Inspirational text */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 text-center">
            <span className="text-[10px] text-sky-400 block font-bold uppercase tracking-wider mb-1">Como ganhar XP?</span>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-medium">
              <div className="p-1 bg-slate-900 rounded">Completar Hábito: <span className="text-emerald-400 font-bold font-mono">+15 XP</span></div>
              <div className="p-1 bg-slate-900 rounded">Minuto de Oração: <span className="text-emerald-400 font-bold font-mono">+10 XP</span></div>
              <div className="p-1 bg-slate-900 rounded">Escrever Diário: <span className="text-emerald-400 font-bold font-mono">+10 XP</span></div>
              <div className="p-1 bg-slate-900 rounded">Reativar Oração: <span className="text-emerald-400 font-bold font-mono">+5 XP</span></div>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
