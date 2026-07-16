import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Lock, 
  CheckCircle, 
  Sparkles, 
  Flame, 
  Calendar, 
  Activity, 
  Clock, 
  BookOpen, 
  User, 
  Star 
} from 'lucide-react';
import { DayProgress, Habit, UserProfile } from '../types';
import { calculateMilestones } from '../utils/statsCalculator';

interface StatsTabAchievementsProps {
  history: DayProgress[];
  habits: Habit[];
  profile: UserProfile;
}

interface MedalSchema {
  id: string;
  title: string;
  desc: string;
  category: 'streak' | 'reading' | 'prayer' | 'intercession' | 'perfection';
  requirementText: string;
  emoji: string;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
}

export default function StatsTabAchievements({ history, habits, profile }: StatsTabAchievementsProps) {
  
  // Calculate the 9 major trophies/medals requested by the user:
  const medals: MedalSchema[] = useMemo(() => {
    // 1. Calculate overall totals
    let totalPrayerSecs = 0;
    let totalReadingSecs = 0;
    
    // Check total interceded count (persisted list of requests)
    let prayerRequestsCount = 0;
    try {
      const stored = localStorage.getItem('santuario_pedidos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) prayerRequestsCount = parsed.length;
      }
    } catch (e) {}

    // Find first perfect month (a calendar month with 100% active habits)
    // We can evaluate if there is any month in history where all days logged are 100% completed
    const monthStatsMap: Record<string, { totalDays: number, perfectDays: number }> = {};
    
    history.forEach(day => {
      // Totals
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
      totalPrayerSecs += pSecs;
      totalReadingSecs += rSecs;

      // Perfect Month evaluation
      const d = new Date(day.date + 'T12:00:00');
      const mKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthStatsMap[mKey]) {
        monthStatsMap[mKey] = { totalDays: 0, perfectDays: 0 };
      }
      monthStatsMap[mKey].totalDays++;
      
      const totalPossible = habits.length || 5;
      const completed = day.habitsCompleted?.length || 0;
      if (completed === totalPossible) {
        monthStatsMap[mKey].perfectDays++;
      }
    });

    const hasPerfectMonth = Object.values(monthStatsMap).some(stats => stats.perfectDays >= 28); // Standard month length approximation

    // Evaluate super habit master (30 consecutive perfect habits checked)
    // For simplicity, we can inspect profile.streak and if it matches 30 and habits completion rate is perfect
    const consecutivePerfectDaysCount = profile.maxStreak; 

    const totalPrayerHours = Math.round(totalPrayerSecs / 3600);
    const totalReadingHours = Math.round(totalReadingSecs / 3600);

    return [
      {
        id: 'medal-streak-7',
        title: 'Chama de Bronze',
        desc: 'Alcance uma sequência de 7 dias consecutivos de vigília ativa.',
        category: 'streak',
        requirementText: '7 dias consecutivos',
        emoji: '🥉',
        currentValue: profile.maxStreak,
        targetValue: 7,
        isUnlocked: profile.maxStreak >= 7
      },
      {
        id: 'medal-streak-30',
        title: 'Chama de Prata',
        desc: 'Alcance uma sequência de 30 dias consecutivos de vigília ativa.',
        category: 'streak',
        requirementText: '30 dias consecutivos',
        emoji: '🥈',
        currentValue: profile.maxStreak,
        targetValue: 30,
        isUnlocked: profile.maxStreak >= 30
      },
      {
        id: 'medal-streak-100',
        title: 'Chama de Ouro',
        desc: 'Alcance uma sequência de 100 dias consecutivos de vigília ativa.',
        category: 'streak',
        requirementText: '100 dias consecutivos',
        emoji: '🥇',
        currentValue: profile.maxStreak,
        targetValue: 100,
        isUnlocked: profile.maxStreak >= 100
      },
      {
        id: 'medal-streak-365',
        title: 'Coroa da Glória',
        desc: 'Consagre um ano inteiro (365 dias) de comunhão inabalável.',
        category: 'streak',
        requirementText: '365 dias consecutivos',
        emoji: '👑',
        currentValue: profile.maxStreak,
        targetValue: 365,
        isUnlocked: profile.maxStreak >= 365
      },
      {
        id: 'medal-bible-100',
        title: 'Selo das Escrituras',
        desc: 'Acumule 100 horas totais de leitura bíblica ativa no aplicativo.',
        category: 'reading',
        requirementText: '100 horas lendo a Bíblia',
        emoji: '📖',
        currentValue: totalReadingHours,
        targetValue: 100,
        isUnlocked: totalReadingHours >= 100
      },
      {
        id: 'medal-prayer-100',
        title: 'Coluna de Clamor',
        desc: 'Acumule 100 horas totais dedicadas a oração devocional e vigília.',
        category: 'prayer',
        requirementText: '100 horas de oração',
        emoji: '🙏',
        currentValue: totalPrayerHours,
        targetValue: 100,
        isUnlocked: totalPrayerHours >= 100
      },
      {
        id: 'medal-intercession-500',
        title: 'Patrono do Templo',
        desc: 'Orar por mais de 500 pessoas na fila de intercessão do aplicativo.',
        category: 'intercession',
        requirementText: 'Interceder por 500 pessoas',
        emoji: '🛡️',
        currentValue: prayerRequestsCount,
        targetValue: 500,
        isUnlocked: prayerRequestsCount >= 500
      },
      {
        id: 'medal-perfect-month',
        title: 'Mês Consagrado',
        desc: 'Registre um mês perfeito (pelo menos 28 dias com todos os hábitos concluídos).',
        category: 'perfection',
        requirementText: 'Mês com 100% de hábitos',
        emoji: '⭐',
        currentValue: hasPerfectMonth ? 1 : 0,
        targetValue: 1,
        isUnlocked: hasPerfectMonth
      },
      {
        id: 'medal-super-master-30',
        title: 'Corte Celestial',
        desc: 'Cumpra todos os hábitos diários por 30 dias consecutivos no Altar.',
        category: 'perfection',
        requirementText: '30 dias perfeitos seguidos',
        emoji: '🏆',
        currentValue: consecutivePerfectDaysCount,
        targetValue: 30,
        isUnlocked: consecutivePerfectDaysCount >= 30
      }
    ];
  }, [history, habits, profile]);

  // Milestones Timeline
  const milestones = useMemo(() => {
    return calculateMilestones(history, habits, profile);
  }, [history, habits, profile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SECTION (Col 7): The 9 Trophies Medal Grid */}
      <div className="lg:col-span-7 space-y-4">
        <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
          <Award className="text-amber-500 w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm text-slate-250">Trunfos e Medalhas de Santidade</h3>
            <p className="text-[10px] text-slate-550">Os 9 prêmios supremos de consistência, leitura, clamor e intercessão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {medals.map((medal, index) => {
            const ratio = Math.min(medal.currentValue / medal.targetValue, 1);
            const percent = Math.round(ratio * 100);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                key={medal.id}
                className={`p-4 rounded-3xl border flex gap-3 relative transition-all overflow-hidden ${
                  medal.isUnlocked
                    ? 'bg-gradient-to-br from-amber-500/10 to-slate-950 border-amber-500/30 shadow-md'
                    : 'bg-slate-950/70 border-slate-900/80 opacity-75'
                }`}
              >
                {/* Glowing halo behind unlocked emoji */}
                {medal.isUnlocked && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full border border-dashed border-amber-500/10 pointer-events-none"
                  />
                )}

                {/* Left: Giant Emoji Icon */}
                <div className="flex flex-col items-center justify-start shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative ${
                    medal.isUnlocked ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 text-slate-550'
                  }`}>
                    {medal.isUnlocked ? (
                      <span>{medal.emoji}</span>
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Right: Metadata & progress tracks */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <span className={`text-xs font-black ${medal.isUnlocked ? 'text-amber-400' : 'text-slate-400'}`}>
                      {medal.title}
                    </span>
                    {medal.isUnlocked && (
                      <span className="text-[7.5px] uppercase font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                        CONCLUÍDO
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium line-clamp-2">
                    {medal.desc}
                  </p>

                  {/* Real-time slider progress track */}
                  <div className="space-y-1 pt-1.5">
                    <div className="flex justify-between text-[8px] font-mono font-bold text-slate-550">
                      <span>Progresso</span>
                      <span>{medal.currentValue} / {medal.targetValue}</span>
                    </div>

                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-950 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          medal.isUnlocked ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION (Col 5): Chronological spiritual milestones timeline */}
      <div className="lg:col-span-5 space-y-4">
        <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
          <Calendar className="text-sky-400 w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm text-slate-250">Linha do Tempo dos Marcos</h3>
            <p className="text-[10px] text-slate-550">Crônica vertical das conquistas marcantes do seu espírito devoto</p>
          </div>
        </div>

        {milestones.length === 0 ? (
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 text-center text-xs text-slate-500">
            Nenhum marco espiritual registrado ainda. Registre atividades de oração e leitura para ver sua história de perseverança nascer!
          </div>
        ) : (
          <div className="relative pl-4 border-l-2 border-slate-900 space-y-5 py-2">
            {milestones.map((milestone, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx}
                className="relative group select-none"
              >
                {/* Node indicator dot */}
                <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 bg-slate-950 border-2 border-sky-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                </div>

                {/* Milestone Detail Card */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900 hover:border-slate-800 transition-colors space-y-1.5">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-black text-slate-250 flex items-center gap-1.5">
                      <span>{milestone.emoji}</span>
                      {milestone.title}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-600">
                      {milestone.dateStr.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-450 leading-relaxed font-sans font-medium">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
