import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  Award, 
  Compass, 
  TrendingUp, 
  Sun, 
  Moon, 
  Quote, 
  ChevronRight, 
  BookOpen, 
  CalendarCheck,
  Plus,
  Trash2,
  Bell,
  Settings,
  Heart,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Habit, DayProgress, UserProfile } from '../types';
import { getLevelTitle, getXPForNextLevel, LEVEL_THRESHOLDS } from '../data/defaultData';
import TimerTab from './TimerTab';

interface DashboardProps {
  key?: string;
  habits: Habit[];
  history: DayProgress[];
  profile: UserProfile;
  currentDateStr: string;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (newHabit: Omit<Habit, 'id' | 'streak' | 'maxStreak' | 'history' | 'createdAt'>) => void;
  onDeleteHabit: (habitId: string) => void;
  onCompleteMeditation: (seconds: number) => void;
  onSaveReflection: (text: string) => void;
  onNavigateToTab: (tabId: 'dashboard' | 'trophies' | 'stats') => void;
}

const SPIRITUAL_QUOTES = [
  { text: "Aquietai-vos, e sabei que eu sou Deus.", author: "Salmos 46:10" },
  { text: "Senhor, fazei-me instrumento de vossa paz.", author: "São Francisco de Assis" },
  { text: "A oração é o encontro da nossa sede com a sede divina.", author: "Agostinho de Hipona" },
  { text: "Nada te perturbe, nada te espante, tudo passa, Deus não muda.", author: "Santa Teresa de Ávila" },
  { text: "No entardecer da vida, seremos julgados pelo amor.", author: "São João da Cruz" },
  { text: "Mas tu, quando orares, entra no teu quarto e, fechada a porta, ora a teu Pai que está em secreto.", author: "Mateus 6:6" },
  { text: "Deus é o templo silencioso das almas que vivem em retidão e verdade.", author: "Imitação de Cristo" }
];

export default function Dashboard({
  habits,
  history,
  profile,
  currentDateStr,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onCompleteMeditation,
  onSaveReflection,
  onNavigateToTab
}: DashboardProps) {
  // Mobile combined sub-tabs navigation: 'panel' for Dashboard tracker, 'prayer' for Silent timer, 'diary' for Journaling
  const [subTab, setSubTab] = useState<'panel' | 'prayer' | 'diary'>('panel');

  // Custom habit creation states (nested in Painel subTab)
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

  // Local notifications reminder simulation settings
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Quote selector
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

  const triggerNotificationLocalTest = () => {
    if (!("Notification" in window)) {
      setNotificationStatus("Não suportado");
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification("QUEBAR Devocional 📖", {
          body: "Seu momento diário com Deus está te aguardando. Venha orar!",
          icon: "/logoo.png"
        });
        setNotificationStatus("Lembrete simulado!");
      } else {
        setNotificationStatus("Sem permissão");
      }
      setTimeout(() => setNotificationStatus(null), 3000);
    });
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-900">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Olá, {profile.name || 'Irmão em Cristo'}
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Caminhada Espiritual Cristã • Nível {profile.level} ({getLevelTitle(profile.level)})
          </p>
        </div>
        <div className="bg-slate-950 px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-slate-850 text-xs text-slate-400 font-mono w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Vigília do Dia:</span>
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
          <p className="text-slate-200 text-xs italic font-medium leading-relaxed">
            "{quote.text}"
          </p>
          <span className="text-[10px] text-slate-500 block mt-1.5 font-mono">— {quote.author}</span>
        </div>
      </div>

      {/* SUB-TABS SELECTOR FOR INNER DASHBOARD COMBINED VIEW */}
      <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-850 flex gap-1 overflow-x-auto scrollbar-none">
        <button
          id="btn-subtab-panel"
          onClick={() => setSubTab('panel')}
          className={`flex-1 min-w-[100px] text-center py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'panel'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span>Painel Cruz</span>
        </button>

        <button
          id="btn-subtab-prayer"
          onClick={() => setSubTab('prayer')}
          className={`flex-1 min-w-[100px] text-center py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'prayer'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-850'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Oração &amp; Vigília</span>
        </button>

        <button
          id="btn-subtab-diary"
          onClick={() => setSubTab('diary')}
          className={`flex-1 min-w-[100px] text-center py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'diary'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-850'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Diário Cristão</span>
        </button>
      </div>

      {/* Tab Contents Renderer */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: PAINEL / DEVOTION HABITS LIST */}
        {subTab === 'panel' && (
          <motion.div
            key="subtab-panel"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Meta do Dia circular chart card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-850 p-5 rounded-3xl space-y-6">
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

              {/* Progress Circle visual element */}
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
                  <span className="text-[11px] text-slate-400 font-medium">Atividades da caminhada concluídas hoje</span>
                </div>
              </div>

              {/* Progress Level bar */}
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
                  <span>Próximo nível: {getLevelTitle(profile.level + 1)}</span>
                </div>
              </div>

              {/* Quick streak view block */}
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

            {/* List of Devotional Habits of Today + adding/editing */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Preces e Atividades de Hoje</h3>
                  <p className="text-[10px] text-slate-500">Monitore sua rotina espiritual e ganhe +15 XP por hábito</p>
                </div>
                
                <div className="flex gap-1.5">
                  <button
                    id="btn-edit-mode-habits"
                    onClick={() => setIsEditingHabits(!isEditingHabits)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                      isEditingHabits
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {isEditingHabits ? 'Sair' : 'Gerenciar'}
                  </button>
                  <button
                    id="btn-toggle-addform"
                    onClick={() => setShowAddHabitForm(prev => !prev)}
                    className="p-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" /> Novo
                  </button>
                </div>
              </div>

              {/* Form container slide to add custom habits */}
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
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Título do Hábito Cristão</label>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        placeholder="Ex: Leitura do Evangelho de Mateus"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Pequena descrição ou propósito</label>
                      <input
                        type="text"
                        maxLength={120}
                        placeholder="Ex: Ler dois capítulos meditando na mensagem de Jesus."
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Frequência / Período</label>
                        <select
                          value={newSchedule}
                          onChange={e => setNewSchedule(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="anytime">Qualquer momento</option>
                          <option value="morning">Pela Manhã</option>
                          <option value="evening">Pela Noite</option>
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
                        Adicionar Hábito
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Habits Check List mapped block */}
              <div className="space-y-2.5">
                {habits.length === 0 ? (
                  <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                    <p className="text-xs text-slate-500 italic">Preceda sua rotina adicionando seus hábitos de fé acima.</p>
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
                            : 'bg-slate-950/70 border-slate-850 hover:bg-slate-950/90'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {/* Easy touch Check Button target size 44px on mobile */}
                          <button
                            id={`btn-toggle-h-${habit.id}`}
                            onClick={() => onToggleHabit(habit.id)}
                            className={`w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-95 cursor-pointer ${
                              checked 
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-inner' 
                                : 'border-slate-800 hover:border-amber-500 bg-slate-900 group-hover:bg-slate-850'
                            }`}
                          >
                            <CheckCircle2 className={`w-5 h-5 ${checked ? 'stroke-[3.5]' : 'text-slate-600'}`} />
                          </button>
                          
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold leading-tight ${checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {habit.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {habit.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${getCategoryThemeColor(habit.category)}`}>
                                {habit.category === 'meditation' ? 'Silêncio' : habit.category === 'reading' ? 'Leitura' : habit.category === 'gratitude' ? 'Gratidão' : habit.category === 'reflection' ? 'Reflexão' : 'Devocional'}
                              </span>
                              <span className="text-[8px] text-slate-500 uppercase font-mono">
                                • {habit.schedule === 'morning' ? 'Manhã' : habit.schedule === 'evening' ? 'Noite' : 'Qualquer horário'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delete button when manage edit mode is enabled */}
                        <AnimatePresence>
                          {isEditingHabits && (
                            <motion.button
                              id={`btn-delete-${habit.id}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              type="button"
                              onClick={() => onDeleteHabit(habit.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                              title="Excluir hábito permanentemente"
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

              {/* Inspirational guidance for quiet prayer */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850/50 flex items-start gap-2 text-slate-400 text-[10px] leading-relaxed">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Sempre que realizar uma atividade, clame a Deus em seu íntimo. Cada prece fortalece sua perseverança espiritual. Use a aba <strong>Oração & Vigília</strong> para seus momentos de oração profunda.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: ORAÇÃO & VIGÍLIA / TIMER TAB INTEGRATED */}
        {subTab === 'prayer' && (
          <motion.div
            key="subtab-prayer"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18 }}
          >
            <TimerTab 
              onCompleteMeditation={onCompleteMeditation}
              userIdName={profile.name}
            />
          </motion.div>
        )}

        {/* SUBTAB 3: DIÁRIO CRISTÃO / REFLECTION WORKSPACES */}
        {subTab === 'diary' && (
          <motion.div
            key="subtab-diary"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Journaling form box */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-slate-100 font-bold text-sm flex items-center gap-2">
                  <BookOpen className="text-indigo-400 w-4.5 h-4.5 shrink-0" />
                  Caderno de Devocional Cristão
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Escreva orações, versículos especiais ou reflexões sobre o agir de Deus na sua caminhada de hoje.
                </p>
              </div>

              <textarea
                id="reflection-textbox"
                rows={6}
                maxLength={600}
                placeholder="Hoje me senti grato a Deus pela minha saúde... Sinto que consegui ler os Salmos em profunda comunhão com Cristo..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 text-xs focus:border-amber-500 focus:outline-none transition-colors"
              />

              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span>{journalText.length}/600 caracteres (ganhe +10 XP ao salvar)</span>
                <button
                  id="btn-save-diary-reflex"
                  type="button"
                  onClick={handleJournalSave}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-slate-100 font-extrabold text-xs rounded-xl shadow-md transition-colors active:scale-95 duration-150 cursor-pointer"
                >
                  Salvar Oração de Hoje
                </button>
              </div>

              <AnimatePresence>
                {savedJournalFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold justify-end"
                  >
                    ✓ Diário espiritual atualizado com sucesso! +10 XP concedidos.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Reminders preferences panel */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
              <div>
                <h3 className="text-slate-100 font-bold text-sm flex items-center gap-2">
                  <Bell className="text-amber-500 w-4.5 h-4.5 shrink-0" />
                  Configurar Notificações
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Não falhe em suas consagrações. Programe os alertas periódicos de vigilância e leitura bíblica.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Lembretes Inteligentes</span>
                    <span className="text-[9px] text-slate-500 block">Ativar avisos de tela integrados</span>
                  </div>
                  <button
                    id="toggle-dash-reminders"
                    type="button"
                    onClick={() => setRemindersEnabled(!remindersEnabled)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${remindersEnabled ? 'bg-amber-500' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${remindersEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <button
                  id="btn-test-alert"
                  onClick={triggerNotificationLocalTest}
                  disabled={!remindersEnabled}
                  className="w-full text-center py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-slate-850 transition-colors disabled:opacity-40"
                >
                  {notificationStatus ? notificationStatus : "Simular Lembrete de Clamor"}
                </button>
              </div>

              {/* Devotional Streaks tips box */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 grid grid-cols-12 gap-2.5">
                <div className="col-span-2 text-indigo-400 flex justify-center pt-0.5">
                  <Heart className="w-4 h-4 fill-indigo-400/10" />
                </div>
                <div className="col-span-10">
                  <span className="text-[10px] font-bold text-slate-300 block">Fidelidade às 10 Semanas</span>
                  <span className="text-[10px] text-slate-400 leading-relaxed block mt-0.5">
                    Os trunfos no QUEBAR recompensam sequências consistentes de 1, 3, 10, 15 dias e 10 semanas de hábitos e orações concluídos. Mantenha seu diário em dia para reforçar sua fé.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
}
