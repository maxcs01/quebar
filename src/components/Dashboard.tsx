import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  BookOpen,
  Play,
  Pause,
  Power,
  RotateCcw,
  Volume2
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
  onCompleteMeditation: (seconds: number, tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura') => void;
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
  onSaveReflection,
  onCompleteMeditation
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

  // INLINE TIMER LOGIC (Directly in main tab as requested)
  const [timerIsPlaying, setTimerIsPlaying] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timerAccumulated, setTimerAccumulated] = useState(0);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerTag, setTimerTag] = useState<'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura'>('aleatorio');
  const [showTimerCompleteModal, setShowTimerCompleteModal] = useState(false);
  const [completedSeconds, setCompletedSeconds] = useState(0);

  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSignaledMilestoneRef = useRef<number>(0);

  // Load active timer state from localStorage to prevent data loss on page refresh
  useEffect(() => {
    const saved = localStorage.getItem('santuario_timer_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.accumulatedTime === 'number') {
          setTimerIsPlaying(parsed.isPlaying);
          setTimerStartTime(parsed.startTime);
          setTimerAccumulated(parsed.accumulatedTime);
          setTimerTag(parsed.selectedTag || 'aleatorio');
        }
      } catch (e) {
        console.warn("Could not parse saved timer state on Dashboard:", e);
      }
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    const state = {
      isPlaying: timerIsPlaying,
      startTime: timerStartTime,
      accumulatedTime: timerAccumulated,
      selectedTag: timerTag
    };
    localStorage.setItem('santuario_timer_state', JSON.stringify(state));
  }, [timerIsPlaying, timerStartTime, timerAccumulated, timerTag]);

  // Ticker for the active inline timer
  useEffect(() => {
    const calculateTime = () => {
      if (timerIsPlaying && timerStartTime !== null) {
        const secondsSinceStart = Math.floor((Date.now() - timerStartTime) / 1000);
        return timerAccumulated + secondsSinceStart;
      }
      return timerAccumulated;
    };

    setTimerElapsed(calculateTime());

    if (timerIsPlaying) {
      timerRef.current = window.setInterval(() => {
        const elapsed = calculateTime();
        setTimerElapsed(elapsed);

        // Emit discrete sound signal every 10 minutes (600 seconds)
        if (elapsed > 0 && elapsed % 600 === 0) {
          const milestone = Math.floor(elapsed / 600);
          if (milestone > lastSignaledMilestoneRef.current) {
            lastSignaledMilestoneRef.current = milestone;
            triggerDashboardMilestoneAlert(elapsed);
          }
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerIsPlaying, timerStartTime, timerAccumulated]);

  // Setup milestone counters
  useEffect(() => {
    if (timerElapsed === 0) {
      lastSignaledMilestoneRef.current = 0;
    } else {
      lastSignaledMilestoneRef.current = Math.floor(timerElapsed / 600);
    }
  }, [timerElapsed]);

  // Discrete sound signal engine
  const playDiscreteSound = () => {
    const saved = localStorage.getItem('santuario_settings');
    let soundSelection = 'gong';
    let alertVolume = 60;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        soundSelection = parsed.soundSelection || 'gong';
        alertVolume = typeof parsed.alertVolume === 'number' ? parsed.alertVolume : 60;
      } catch (e) {}
    }

    if (soundSelection === 'none' || alertVolume === 0) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const now = ctx.currentTime;
      const volumeMultiplier = (alertVolume / 100) * 0.4;

      const beep = (freq: number, start: number, duration: number, vol: number, typeStr: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = typeStr;
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(vol, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
      };

      if (soundSelection === 'gong') {
        beep(220, 0.0, 0.4, volumeMultiplier);
        beep(220, 0.15, 0.4, volumeMultiplier);
        beep(220, 0.30, 0.7, volumeMultiplier * 1.1);
      } else if (soundSelection === 'bell') {
        beep(523.25, 0, 0.15, volumeMultiplier * 0.85);
        beep(587.33, 0.1, 0.15, volumeMultiplier * 0.85);
        beep(659.25, 0.25, 0.2, volumeMultiplier * 0.85);
      } else if (soundSelection === 'bowl') {
        beep(440, 0, 0.15, volumeMultiplier, 'sine');
        beep(554.37, 0.2, 0.5, volumeMultiplier * 0.9);
      }
    } catch (e) {
      console.log("Audio synthesis locked on dashboard", e);
    }
  };

  const triggerDashboardMilestoneAlert = (elapsedSecs: number) => {
    // Read user sound preference
    const saved = localStorage.getItem('santuario_settings');
    let enabled = true;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        enabled = parsed.enableMilestoneAlerts !== false;
      } catch (e) {}
    }

    if (enabled) {
      playDiscreteSound();
    }

    // Trigger browser background alert
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const mins = Math.round(elapsedSecs / 60);
        new Notification(`⏱️ Marco alcançado: ${mins} Minutos`, {
          body: `Você completou ${mins} minutos de consagração e vigília ativa. Continue em sintonia!`,
          vibrate: [150, 100, 150],
          tag: 'quebar-timer-milestone',
        } as any);
      } catch (e) {}
    }

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }
  };

  const handleStartTimer = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setTimerIsPlaying(true);
    setTimerStartTime(Date.now());
  };

  const handlePauseTimer = () => {
    if (timerIsPlaying && timerStartTime !== null) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      setTimerAccumulated(prev => prev + elapsed);
    }
    setTimerIsPlaying(false);
    setTimerStartTime(null);
  };

  const handleStopTimer = () => {
    let finalSeconds = timerAccumulated;
    if (timerIsPlaying && timerStartTime !== null) {
      finalSeconds += Math.floor((Date.now() - timerStartTime) / 1000);
    }

    if (finalSeconds > 0) {
      setCompletedSeconds(finalSeconds);
      setShowTimerCompleteModal(true);
      onCompleteMeditation(finalSeconds, timerTag);
    }

    // Fully Reset states
    setTimerIsPlaying(false);
    setTimerStartTime(null);
    setTimerAccumulated(0);
    setTimerElapsed(0);
    localStorage.removeItem('santuario_timer_state');
  };

  const handleResetTimer = () => {
    setTimerIsPlaying(false);
    setTimerStartTime(null);
    setTimerAccumulated(0);
    setTimerElapsed(0);
    localStorage.removeItem('santuario_timer_state');
  };

  // Format Helper
  const formatSeconds = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
      case 'spiritual': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'reading': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
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
      {/* 1. SEÇÃO DE VIGÍLIA EM DESTAQUE PRINCIPAL (MANDATORY CEILING OF PRIORITY) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-xl space-y-5">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.02] translate-x-4 translate-y-4">
          <Clock className="w-56 h-56 text-slate-200" />
        </div>

        {/* Header inside Vigilance Board */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Altar Devocional Diário
            </span>
            <h3 className="text-lg font-black text-slate-100 mt-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" />
              Vigília e Contemplação Ativa
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comece sua vigília. O tempo é crescente e a cada 10 minutos um discreto sinal soará.
            </p>
          </div>

          <div className="bg-slate-950 p-2 rounded-2xl border border-slate-850 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-slate-400">Total Hoje: </span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {Math.round((todayProgress?.meditationSeconds || 0) / 60)} min
            </span>
          </div>
        </div>

        {/* Interactive Cronômetro controls & display card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Big numbers countdown area */}
          <div className="md:col-span-5 bg-slate-950 p-4.5 rounded-2xl border border-slate-900 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cronômetro de Foco</span>
            <span className="text-3xl font-black font-mono tracking-wider text-sky-400 select-none my-1">
              {formatSeconds(timerElapsed)}
            </span>
            <span className="text-[9px] px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              Categoria: {timerTag === 'despertar' ? '🌅 Despertar' : timerTag === 'manha' ? '☀️ Manhã' : timerTag === 'noite' ? '🌙 Noite' : timerTag === 'leitura' ? '📖 Leitura' : '🙏 Geral'}
            </span>
          </div>

          {/* Preset trigger launchers and playback */}
          <div className="md:col-span-7 space-y-3.5">
            
            {/* Action controls */}
            <div className="flex gap-2.5">
              {!timerIsPlaying ? (
                <button
                  onClick={handleStartTimer}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/5 active:scale-97 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  {timerElapsed > 0 ? 'Retomar Contagem' : 'Iniciar Contagem'}
                </button>
              ) : (
                <button
                  onClick={handlePauseTimer}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 transition-all border border-slate-700/40"
                >
                  <Pause className="w-3.5 h-3.5 fill-slate-200" />
                  Pausar Contagem
                </button>
              )}

              {timerElapsed > 0 && (
                <>
                  <button
                    onClick={handleStopTimer}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 transition-all"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Parar &amp; Gravar
                  </button>

                  <button
                    onClick={handleResetTimer}
                    className="p-3 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    title="Zerar sem Salvar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Tag/Category presets triggers */}
            <div className="flex flex-wrap gap-1.5">
              {(['aleatorio', 'despertar', 'manha', 'noite', 'leitura'] as const).map(tag => (
                <button
                  key={tag}
                  disabled={timerIsPlaying}
                  onClick={() => setTimerTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    timerTag === tag
                      ? 'bg-sky-500/15 border-sky-500/45 text-sky-400'
                      : timerIsPlaying
                        ? 'bg-slate-950/20 border-slate-950 text-slate-650 cursor-not-allowed'
                        : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-slate-350'
                  }`}
                >
                  {tag === 'despertar' ? '🌅 Despertar' : tag === 'manha' ? '☀️ Manhã' : tag === 'noite' ? '🌙 Noite' : tag === 'leitura' ? '📖 Leitura' : '🙏 Geral'}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* 2. COMPACT RESUMO DIÁRIO (BENTO GRID STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Profile Card & XP progression bar (Left, 5 columns) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-850 p-4.5 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-1.5">
                Olá, {profile.name || 'Irmão'}
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
              </h2>
              <span className="text-[10px] text-slate-500 block uppercase font-black tracking-wider">
                Nível {profile.level} • {getLevelTitle(profile.level)}
              </span>
            </div>

            {/* Small circular progression widget */}
            <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-850 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="18" className="stroke-slate-900 fill-transparent stroke-[3.5]" />
                <motion.circle 
                  cx="24" 
                  cy="24"
                  r="18" 
                  className="stroke-sky-400 fill-transparent stroke-[3.5]"
                  strokeDasharray={2 * Math.PI * 18}
                  initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - completionRatio) }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <span className="absolute text-[9px] font-mono font-extrabold text-sky-400">{completionPercent}%</span>
            </div>
          </div>

          {/* Real progress track */}
          <div className="space-y-1.5 pt-2 border-t border-slate-850/60">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>XP Geral do Altar</span>
              <span className="text-sky-400 font-bold">{profile.xp - previousLevelThreshold} / {nextLevelXPNeeded} XP</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgressPercent}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-450 rounded-full"
              />
            </div>
          </div>

          {/* Quick numbers row */}
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900">
              <span className="text-[8px] uppercase text-slate-550 block font-bold">Fidelidade</span>
              <span className="text-xs font-black font-mono text-sky-400">{profile.streak} dias</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-900">
              <span className="text-[8px] uppercase text-slate-550 block font-bold">Hábitos Hoje</span>
              <span className="text-xs font-black font-mono text-emerald-400">{completedTodayCount} concluídos</span>
            </div>
          </div>

        </div>

        {/* Daily quotes box (Right, 7 columns) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-850 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.015] translate-x-4 translate-y-4">
            <Compass className="w-32 h-32 text-slate-300" />
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 shrink-0">
              <Quote className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Passagem do Dia</span>
              <p className="text-slate-200 text-xs sm:text-sm italic font-medium leading-relaxed">
                "{quote.text}"
              </p>
              <span className="text-[9px] text-slate-500 block font-mono">— {quote.author}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. LIST OF DEVOTIONAL HABITS (LOGO ABAIXO DA VIGÍLIA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* DEVOTIONAL CHECKLISTS (Left, 7 columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4 shadow-md">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-200">Hábitos e Atividades de Fé</h3>
              <p className="text-[10px] text-slate-500">Pratique as disciplinas devocionais e receba +15 XP por hábito concluído</p>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsEditingHabits(!isEditingHabits)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                  isEditingHabits
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-100'
                }`}
              >
                {isEditingHabits ? 'Pronto' : 'Gerenciar'}
              </button>
              <button
                onClick={() => setShowAddHabitForm(prev => !prev)}
                className="p-1 px-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" /> Adicionar
              </button>
            </div>
          </div>

          {/* Form to add custom habits inline */}
          <AnimatePresence>
            {showAddHabitForm && (
              <motion.form
                onSubmit={handleHabitSubmit}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
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
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
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
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
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
                    className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Gravar Hábito
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Checkboxes List */}
          <div className="space-y-2.5">
            {habits.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                <p className="text-xs text-slate-500 italic">Adicione seus propósitos para iniciar a contagem diária.</p>
              </div>
            ) : (
              habits.map(habit => {
                const checked = todayProgress?.habitsCompleted?.includes(habit.id) || false;
                return (
                  <div
                    key={habit.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl transition-all border ${
                      checked 
                        ? 'bg-sky-500/5 border-sky-500/25 shadow-sm' 
                        : 'bg-slate-950/75 border-slate-850 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Touch target standard size >= 44px */}
                      <button
                        id={`btn-toggle-h-${habit.id}`}
                        onClick={() => onToggleHabit(habit.id)}
                        className={`w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-95 cursor-pointer ${
                          checked 
                            ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-inner' 
                            : 'border-slate-800 hover:border-sky-500 bg-slate-900 group-hover:bg-slate-850'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${checked ? 'stroke-[3.5]' : 'text-slate-600'}`} />
                      </button>
                      
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-bold leading-tight ${checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {habit.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {habit.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${getCategoryThemeColor(habit.category)}`}>
                            {habit.category === 'meditation' ? 'Silêncio' : habit.category === 'reading' ? 'Leitura' : habit.category === 'gratitude' ? 'Gratidão' : habit.category === 'reflection' ? 'Reflexão' : 'Devocional'}
                          </span>
                          <span className="text-[8px] text-slate-550 uppercase font-mono">
                            • {habit.schedule === 'morning' ? 'Manhã' : habit.schedule === 'evening' ? 'Noite' : 'Qualquer momento'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete handler button */}
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

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/50 flex items-start gap-2 text-slate-550 text-[10px] leading-relaxed">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Cumpra seus hábitos com retidão moral e comunhão constante. Suas conquistas desbloqueiam conquistas (Trunfos) e novos níveis de perseverança intelectual e espiritual.
            </span>
          </div>

        </div>

        {/* DIÁRIO DEVOCIONAL DO DIA (Right, 5 columns) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="text-sky-400 w-4.5 h-4.5" />
            Diário Devocional do Dia
          </h3>
          
          <textarea
            rows={5}
            placeholder="Escreva suas reflexões espirituais, orações ou preces do dia. O hábito de preencher seu diário diariamente concede +10 XP para sua alma!"
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-3.5 text-xs text-slate-250 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 leading-relaxed resize-none font-sans"
          />
          
          <button
            onClick={handleJournalSave}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-slate-100 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            {savedJournalFeedback ? 'Reflexão Gravada! ✝️' : 'Salvar no Diário Local'}
          </button>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 text-[10px] text-slate-500 leading-normal">
            Seu diário é criptografado localmente no espaço isolado de dados do seu navegador. Nenhuma entidade externa ou servidor possui acesso a ele.
          </div>
        </div>

      </div>

      {/* Inline Timer Completion Feedback Modal */}
      <AnimatePresence>
        {showTimerCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimerCompleteModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-5 shadow-2xl z-50"
            >
              <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center rounded-2xl mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-100 font-sans">
                  Vigília Registrada com Sucesso!
                </h3>
                <p className="text-slate-400 text-xs">
                  Sua contagem crescente de vigília foi gravada e salvas nos anais do templo espiritual.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">Tempo no Altar</span>
                  <span className="text-lg font-bold font-mono text-sky-450 mt-1 block">
                    {formatSeconds(completedSeconds)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">XP Multiplicada</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    +{Math.round(completedSeconds / 60) * 10} XP
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                "Não cesses de falar deste livro da Lei; antes, medita nele dia e noite, para que tenhas cuidado de fazer segundo tudo quanto nele está escrito." — Josué 1:8
              </p>

              <button
                onClick={() => setShowTimerCompleteModal(false)}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                Glorificar &amp; Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
