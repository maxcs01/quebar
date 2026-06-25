import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  Award, 
  Compass, 
  TrendingUp, 
  Quote, 
  Plus, 
  Trash2, 
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { Habit, DayProgress, UserProfile } from '../types';
import { getLevelTitle, getXPForNextLevel, LEVEL_THRESHOLDS } from '../data/defaultData';

interface DashboardProps {
  habits: Habit[];
  history: DayProgress[];
  profile: UserProfile;
  currentDateStr: string;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (newHabit: Omit<Habit, 'id' | 'streak' | 'maxStreak' | 'history' | 'createdAt'>) => void;
  onDeleteHabit: (habitId: string) => void;
  onSaveReflection: (text: string) => void;
}

const SPIRITUAL_QUOTES = [
  { text: "Aquietai-vos, e sabei que eu sou Deus.", author: "Salmos 46:10" },
  { text: "Mas tu, quando orares, entra no teu quarto e, fechada a porta, ora a teu Pai que está em secreto.", author: "Mateus 6:6" },
  { text: "Tudo posso naquele que me fortalece.", author: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor, nada me faltará.", author: "Salmos 23:1" },
  { text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.", author: "Isaías 40:31" },
  { text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai senão por mim.", author: "João 14:6" },
  { text: "Se Deus é por nós, quem será contra nós?", author: "Romanos 8:31" }
];

export default function Dashboard({
  habits,
  history,
  profile,
  currentDateStr,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onSaveReflection
}: DashboardProps) {
  // Custom habit creation states
  const [showAddHabitForm, setShowAddHabitForm] = useState(false);
  const [isEditingHabits, setIsEditingHabits] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'spiritual' | 'meditation' | 'reading' | 'reflection' | 'gratitude'>('spiritual');
  const [newSchedule, setNewSchedule] = useState<'morning' | 'evening' | 'anytime'>('anytime');

  // Daily reflection journal states
  const todayProgress = history.find(entry => entry.date === currentDateStr);
  const [journalText, setJournalText] = useState(todayProgress?.reflection || '');
  const [savedJournalFeedback, setSavedJournalFeedback] = useState(false);

  // Quote selector based on current date
  const quote = useMemo(() => {
    const day = new Date(currentDateStr).getDate() || 1;
    return SPIRITUAL_QUOTES[day % SPIRITUAL_QUOTES.length];
  }, [currentDateStr]);

  // Overall statistics and completions percentage
  const totalPossible = habits.length;
  const completedTodayCount = todayProgress?.habitsCompleted?.length || 0;
  const completionRatio = totalPossible > 0 ? completedTodayCount / totalPossible : 0;
  const completionPercent = Math.round(completionRatio * 100);

  // XP Progress calculators
  const nextLevelXPNeeded = useMemo(() => {
    return getXPForNextLevel(profile.level);
  }, [profile.level]);

  const previousLevelThreshold = useMemo(() => {
    const current = LEVEL_THRESHOLDS.find(t => t.level === profile.level);
    return current ? current.xpNeeded : 0;
  }, [profile.level]);

  const levelProgressPercent = useMemo(() => {
    const gainedInThisLevel = profile.xp - previousLevelThreshold;
    return Math.min(Math.max(Math.round((gainedInThisLevel / nextLevelXPNeeded) * 100), 0), 100);
  }, [profile, previousLevelThreshold, nextLevelXPNeeded]);

  // Handle custom habit creation submissions
  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      name: newTitle.trim(),
      description: newDesc.trim() || 'Prática devocional sincera.',
      category: newCategory,
      schedule: newSchedule,
    });

    setNewTitle('');
    setNewDesc('');
    setNewCategory('spiritual');
    setNewSchedule('anytime');
    setShowAddHabitForm(false);
  };

  const handleJournalSave = () => {
    onSaveReflection(journalText);
    setSavedJournalFeedback(true);
    setTimeout(() => setSavedJournalFeedback(false), 2500);
  };

  const getCategoryThemeColor = (category: string) => {
    switch (category) {
      case 'meditation': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'spiritual': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'reading': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'reflection': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'gratitude': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      {/* Header Profile / Realtime status card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-4 sm:p-5 rounded-3xl border border-slate-900">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Olá, {profile.name || 'Praticante'}
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Caminhada Espiritual Cristã • Nível {profile.level} ({getLevelTitle(profile.level)})
          </p>
        </div>
        <div className="bg-slate-950 px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-slate-850 text-xs text-slate-400 font-mono w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Hoje</span>
          </div>
          <strong className="text-amber-500 font-extrabold">{currentDateStr}</strong>
        </div>
      </div>

      {/* Inspirational Daily verses container */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-900 relative overflow-hidden flex gap-3.5 items-start">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] translate-x-4 translate-y-4">
          <Compass className="w-24 h-24 text-slate-200" />
        </div>
        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
          <Quote className="w-4 h-4" />
        </div>
        <div>
          <p className="text-slate-200 text-xs sm:text-sm italic font-medium leading-relaxed">
            "{quote.text}"
          </p>
          <span className="text-[10px] text-slate-500 block mt-1.5 font-mono">— {quote.author}</span>
        </div>
      </div>

      {/* Main Grid: Left Side is Metrics & Level, Right Side is Checkbox habits tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* METRICS & LEVEL PROGRESS (Lg spans 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Circular Chart & XP progress */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-850 p-5 rounded-3xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Sopro do Dia
                </span>
                <h3 className="text-base font-bold text-slate-200 mt-2">Graça e Consagração</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Realize seus devocionais para progredir.</p>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-850 text-amber-500">
                <Flame className="w-5 h-5 fill-amber-500/10" />
              </div>
            </div>

            {/* Circular Progress element */}
            <div className="flex items-center gap-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-850/50">
              <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 relative shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="24" className="stroke-slate-900 fill-transparent stroke-[4.5]" />
                  <motion.circle 
                    cx="32" 
                    cy="32"
                    r="24" 
                    className="stroke-amber-500 fill-transparent stroke-[4.5]"
                    strokeDasharray={2 * Math.PI * 24}
                    initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - completionRatio) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <span className="absolute text-[11px] font-mono font-black text-amber-400">{completionPercent}%</span>
              </div>
              <div>
                <span className="text-xl font-black text-slate-200 font-mono tracking-tight block">
                  {completedTodayCount} <span className="text-xs text-slate-500">de</span> {totalPossible}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Atividades de fé concluídas hoje</span>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="pt-4 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-xs font-mono mb-2 text-slate-300">
                <span>Progresso do Nível {profile.level}</span>
                <span className="text-amber-500 font-black">{profile.xp - previousLevelThreshold} / {nextLevelXPNeeded} XP</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                />
              </div>
              <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-500">
                <span>{getLevelTitle(profile.level)}</span>
                <span>Próximo: {getLevelTitle(profile.level + 1)}</span>
              </div>
            </div>

            {/* Quick stats cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500/10 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block">Sequência</span>
                  <span className="text-xs font-black text-slate-200 font-mono">{profile.streak} dias</span>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block">Total Oração</span>
                  <span className="text-xs font-black text-slate-200 font-mono">
                    {Math.round(history.reduce((sum, d) => sum + (d.meditationSeconds || 0), 0) / 60)} min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Journal Reflection Box */}
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="text-indigo-400 w-4.5 h-4.5" />
              Diário Devocional do Dia
            </h3>
            
            <textarea
              rows={4}
              placeholder="Escreva suas reflexões espirituais, orações ou preces do dia. Escrever no diário concede +10 XP!"
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-3.5 text-xs text-slate-250 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed resize-none font-sans"
            />
            
            <button
              onClick={handleJournalSave}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              {savedJournalFeedback ? 'Reflexão Gravada! ✝️' : 'Salvar no Diário Local'}
            </button>
          </div>

        </div>

        {/* LIST OF DEVOTIONAL HABITS (Lg spans 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-200">Hábitos e Atividades</h3>
              <p className="text-[10px] text-slate-500">Marque as tarefas e ganhe +15 XP por hábito concluído</p>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsEditingHabits(!isEditingHabits)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                  isEditingHabits
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100'
                }`}
              >
                {isEditingHabits ? 'Pronto' : 'Gerenciar'}
              </button>
              <button
                onClick={() => setShowAddHabitForm(prev => !prev)}
                className="p-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" /> Adicionar
              </button>
            </div>
          </div>

          {/* Form to add custom habits */}
          <AnimatePresence>
            {showAddHabitForm && (
              <motion.form
                onSubmit={handleHabitSubmit}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 mr-0.5"
              >
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Título do Hábito</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ex: Leitura Bíblica Diária"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Pequeno propósito</label>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Ex: Ler 2 capítulos de Provérbios meditando na sabedoria."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Horário recomendado</label>
                    <select
                      value={newSchedule}
                      onChange={e => setNewSchedule(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="anytime">Qualquer momento</option>
                      <option value="morning">Manhã</option>
                      <option value="evening">Noite</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="spiritual">Devocional / Oração</option>
                      <option value="reading">Leitura Bíblica</option>
                      <option value="meditation">Oração Silenciosa</option>
                      <option value="gratitude">Gratidão Cristã</option>
                      <option value="reflection">Exame de Consciência</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddHabitForm(false)}
                    className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Gravar Hábito
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of Habits */}
          <div className="space-y-2.5">
            {habits.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                <p className="text-xs text-slate-500 italic">Adicione seus hábitos para começar sua caminhada.</p>
              </div>
            ) : (
              habits.map(habit => {
                const checked = todayProgress?.habitsCompleted?.includes(habit.id) || false;
                return (
                  <div
                    key={habit.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      checked 
                        ? 'bg-amber-500/5 border-amber-500/25 shadow-sm' 
                        : 'bg-slate-950/75 border-slate-850 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Interactive target >= 44px */}
                      <button
                        id={`btn-toggle-h-${habit.id}`}
                        onClick={() => onToggleHabit(habit.id)}
                        className={`w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-95 cursor-pointer ${
                          checked 
                            ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-inner' 
                            : 'border-slate-800 hover:border-amber-500 bg-slate-900 group-hover:bg-slate-850'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${checked ? 'stroke-[3.5]' : 'text-slate-650'}`} />
                      </button>
                      
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-bold leading-tight ${checked ? 'text-slate-550 line-through' : 'text-slate-200'}`}>
                          {habit.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {habit.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${getCategoryThemeColor(habit.category)}`}>
                            {habit.category === 'meditation' ? 'Silêncio' : habit.category === 'reading' ? 'Leitura' : habit.category === 'gratitude' ? 'Gratidão' : habit.category === 'reflection' ? 'Reflexão' : 'Devocional'}
                          </span>
                          <span className="text-[8px] text-slate-500 uppercase font-mono">
                            • {habit.schedule === 'morning' ? 'Manhã' : habit.schedule === 'evening' ? 'Noite' : 'A qualquer hora'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete mode button */}
                    <AnimatePresence>
                      {isEditingHabits && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={() => onDeleteHabit(habit.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors cursor-pointer ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/50 flex items-start gap-2 text-slate-400 text-[10px] sm:text-xs leading-relaxed">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Suas atividades são salvas localmente no navegador de forma privada e segura. Nenhum dado espiritual é transmitido ou sincronizado na nuvem. Use o Cronômetro para vigílias devocionais completas.
            </span>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
