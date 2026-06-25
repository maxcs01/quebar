import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Clock, 
  Award, 
  TrendingUp, 
  User, 
  Sparkles,
  Flame,
  X,
  Sliders,
  CheckCircle2,
  Info,
  Heart
} from 'lucide-react';

import { Habit, DayProgress, UserProfile, PrayerRequest } from './types';
import { DEFAULT_HABITS, LEVEL_THRESHOLDS, getLevelTitle } from './data/defaultData';
import Dashboard from './components/Dashboard';
import PrayersTab from './components/PrayersTab';
import TrophiesTab from './components/TrophiesTab';
import StatsTab from './components/StatsTab';
import SettingsTab from './components/SettingsTab';

// Localstorage keys
const HABITS_STORAGE_KEY = 'santuario_habitos';
const HISTORY_STORAGE_KEY = 'santuario_historico';
const PROFILE_STORAGE_KEY = 'santuario_perfil';

// Safe date converters
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  // Navigation State supporting 5 premium sections
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prayers' | 'trophies' | 'stats' | 'settings'>('dashboard');

  // Real-world date tracking
  const currentDateStr = useMemo(() => {
    return formatDate(new Date());
  }, []);

  // Instantly load states from local storage or default data
  const [habits, setHabits] = useState<Habit[]>(() => {
    const stored = localStorage.getItem(HABITS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_HABITS;
  });

  const [history, setHistory] = useState<DayProgress[]>(() => {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.xp >= 0) return parsed;
      } catch (e) {}
    }
    return {
      name: 'Praticante Espiritual',
      level: 1,
      xp: 0,
      streak: 0,
      maxStreak: 0,
      lastActiveDate: formatDate(new Date()),
      notificationPreferences: {
        enabled: true,
        morningTime: '07:00',
        eveningTime: '21:00'
      }
    };
  });

  // Modal renaming profile state
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [tempProfileName, setTempProfileName] = useState<string>('');

  // Level up alert state
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  // Animated Custom Toast system
  const [toasts, setToasts] = useState<Array<{ id: string; text: string; type: 'success' | 'error' | 'info' }>>([]);
  
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Persist states to local storage automatically on change
  useEffect(() => {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Prayers State & CRUD
  const [prayers, setPrayers] = useState<PrayerRequest[]>(() => {
    const stored = localStorage.getItem('santuario_pedidos');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('santuario_pedidos', JSON.stringify(prayers));
  }, [prayers]);

  const handleAddPrayer = (name: string, text: string) => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 7);
    const expiresAt = formatDate(future);

    const newPrayer: PrayerRequest = {
      id: Date.now().toString(),
      personName: name,
      requestText: text,
      createdAt: currentDateStr,
      expiresAt: expiresAt
    };

    setPrayers(prev => [newPrayer, ...prev]);
    showToast("Pedido de oração adicionado com sucesso!", "success");
  };

  const handleDeletePrayer = (id: string) => {
    setPrayers(prev => prev.filter(p => p.id !== id));
    showToast("Pedido de oração removido.", "success");
  };

  const handleReactivatePrayer = (id: string) => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 7);
    const expiresAt = formatDate(future);

    setPrayers(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          createdAt: currentDateStr,
          expiresAt: expiresAt
        };
      }
      return p;
    }));
    showToast("Período de oração renovado por mais 7 dias!", "success");
  };

  const handleUpdatePrayer = (id: string, name: string, text: string) => {
    setPrayers(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          personName: name,
          requestText: text
        };
      }
      return p;
    }));
    showToast("Pedido de oração atualizado.", "success");
  };

  // Recalculate streak values dynamically from history logs
  useEffect(() => {
    const streakResult = runStreakUpdate(history, currentDateStr);
    setProfile(prev => {
      if (prev.streak !== streakResult.streak || prev.maxStreak !== streakResult.max) {
        return {
          ...prev,
          streak: streakResult.streak,
          maxStreak: streakResult.max
        };
      }
      return prev;
    });
  }, [history, currentDateStr]);

  // Level Up logic validator
  const checkLevelUp = (currentXP: number, previousLevel: number) => {
    let computedLevel = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (currentXP >= LEVEL_THRESHOLDS[i].xpNeeded) {
        computedLevel = LEVEL_THRESHOLDS[i].level;
        break;
      }
    }

    if (computedLevel > previousLevel) {
      setUnlockedLevel(computedLevel);
      setShowLevelUpModal(true);
      return computedLevel;
    }
    return previousLevel;
  };

  // Global XP score handler
  const addXP = (gainedXP: number) => {
    setProfile(prev => {
      const newXP = prev.xp + gainedXP;
      const checkedLevel = checkLevelUp(newXP, prev.level);
      return {
        ...prev,
        xp: newXP,
        level: checkedLevel
      };
    });
  };

  // Dynamic Streak Calculator
  const runStreakUpdate = (currentHis: DayProgress[], currentDate: string) => {
    if (currentHis.length === 0) return { streak: 0, max: profile.maxStreak };

    const activeDays = Array.from(
      new Set(
        currentHis
          .filter(day => {
            const hasHabits = day.habitsCompleted && day.habitsCompleted.length > 0;
            const hasMeditation = day.meditationSeconds && day.meditationSeconds > 0;
            const hasReflection = day.reflection && day.reflection.trim().length > 0;
            return hasHabits || hasMeditation || hasReflection;
          })
          .map(day => day.date)
      )
    ).sort((a, b) => parseLocalDate(b).getTime() - parseLocalDate(a).getTime());
    
    if (activeDays.length === 0) return { streak: 0, max: profile.maxStreak };

    const todayDate = parseLocalDate(currentDate);
    const yesterdayDate = parseLocalDate(currentDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);
    
    const todayStr = currentDate;
    const yesterdayStr = formatDate(yesterdayDate);

    const lastActive = activeDays[0];
    if (lastActive !== todayStr && lastActive !== yesterdayStr) {
      return { streak: 0, max: profile.maxStreak };
    }

    let currentStreak = 1;
    let checker = parseLocalDate(lastActive);
    const activeDaysSet = new Set(activeDays);

    while (true) {
      checker.setDate(checker.getDate() - 1);
      const checkerStr = formatDate(checker);
      
      if (activeDaysSet.has(checkerStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const maxStreak = Math.max(currentStreak, profile.maxStreak);

    return {
      streak: currentStreak,
      max: maxStreak
    };
  };

  // Toggle single habit completion status
  const handleToggleHabit = (habitId: string) => {
    let xpDiff = 0;
    let updatedHistory = [...history];
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);

    if (existingEntryIndex !== -1) {
      const entry = updatedHistory[existingEntryIndex];
      const hasCompleted = entry.habitsCompleted.includes(habitId);
      
      let updatedCompletions = [];
      if (hasCompleted) {
        updatedCompletions = entry.habitsCompleted.filter(id => id !== habitId);
        xpDiff = -15;
      } else {
        updatedCompletions = [...entry.habitsCompleted, habitId];
        xpDiff = 15;
      }

      updatedHistory[existingEntryIndex] = {
        ...entry,
        habitsCompleted: updatedCompletions
      };
    } else {
      updatedHistory.push({
        date: currentDateStr,
        habitsCompleted: [habitId],
        meditationSeconds: 0
      });
      xpDiff = 15;
    }

    setHistory(updatedHistory);
    
    if (xpDiff !== 0) {
      addXP(xpDiff);
    }

    setProfile(prev => ({
      ...prev,
      lastActiveDate: currentDateStr
    }));
  };

  // Adding custom habit
  const handleAddHabit = (newHabitData: Omit<Habit, 'id' | 'streak' | 'maxStreak' | 'history' | 'createdAt'>) => {
    const newId = `hb-custom-${Date.now()}`;
    const freshHabit: Habit = {
      ...newHabitData,
      id: newId,
      streak: 0,
      maxStreak: 0,
      history: [],
      createdAt: currentDateStr
    };

    setHabits(prev => [...prev, freshHabit]);
    showToast("Novo hábito de fé adicionado com sucesso!", "success");
  };

  // Deleting habit
  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setHistory(prev => prev.map(day => ({
      ...day,
      habitsCompleted: day.habitsCompleted.filter(id => id !== habitId)
    })));
    showToast("Hábito espiritual removido.", "info");
  };

  // Save diary reflections
  const handleSaveReflection = (text: string) => {
    let updatedHistory = [...history];
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);

    if (existingEntryIndex !== -1) {
      updatedHistory[existingEntryIndex] = {
        ...updatedHistory[existingEntryIndex],
        reflection: text
      };
    } else {
      updatedHistory.push({
        date: currentDateStr,
        habitsCompleted: [],
        meditationSeconds: 0,
        reflection: text
      });
    }

    setHistory(updatedHistory);
    addXP(10);
    setProfile(prev => ({
      ...prev,
      lastActiveDate: currentDateStr
    }));
  };

  // Conclude prayer session
  const handleCompleteMeditation = (seconds: number, tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura' = 'aleatorio') => {
    let updatedHistory = [...history];
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);

    const newSession = {
      durationSeconds: seconds,
      tag: tag,
      timestamp: new Date().toISOString()
    };

    if (existingEntryIndex !== -1) {
      const entry = updatedHistory[existingEntryIndex];
      const currentSessions = entry.sessions || [];
      updatedHistory[existingEntryIndex] = {
        ...entry,
        meditationSeconds: (entry.meditationSeconds || 0) + seconds,
        sessions: [...currentSessions, newSession]
      };
    } else {
      updatedHistory.push({
        date: currentDateStr,
        habitsCompleted: [],
        meditationSeconds: seconds,
        sessions: [newSession]
      });
    }

    setHistory(updatedHistory);

    // 10 XP per minute completed
    const minutesCompleted = Math.round(seconds / 60);
    const xpReward = Math.max(minutesCompleted * 10, 5); // at least 5 XP
    addXP(xpReward);

    setProfile(prev => ({
      ...prev,
      lastActiveDate: currentDateStr
    }));
  };

  // Hard Reset local database (passed to settings tab)
  const handleResetApp = () => {
    localStorage.removeItem(HABITS_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('santuario_settings');
    localStorage.removeItem('santuario_timer_state');
    localStorage.removeItem('santuario_pedidos');
    
    setHabits(DEFAULT_HABITS);
    setHistory([]);
    setPrayers([]);
    setProfile({
      name: 'Praticante Espiritual',
      level: 1,
      xp: 0,
      streak: 0,
      maxStreak: 0,
      lastActiveDate: formatDate(new Date()),
      notificationPreferences: {
        enabled: true,
        morningTime: '07:00',
        eveningTime: '21:00'
      }
    });
    setActiveTab('dashboard');
  };

  const handleSaveSpiritualName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempProfileName.trim()) {
      setProfile(prev => ({
        ...prev,
        name: tempProfileName.trim()
      }));
      showToast("Nome espiritual gravado com glória!", "success");
      setShowRenameModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Premium Minimal Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-slate-850 bg-slate-950 flex items-center justify-center p-0.5 shadow-md">
              <img src="/logoo.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-slate-100">QUEBAR</h1>
              <span className="text-[10px] text-slate-450 block leading-none font-bold uppercase tracking-wider">Caminhada Cristã</span>
            </div>
          </div>

          {/* Quick Profile rename button & Streak indicator */}
          <div className="flex items-center gap-3">
            
            {/* Streak Counter */}
            <div className="bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500/20 animate-pulse" />
              <span className="font-mono">{profile.streak}d</span>
            </div>

            {/* Profile trigger */}
            <button 
              onClick={() => {
                setTempProfileName(profile.name);
                setShowRenameModal(true);
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left shadow-sm active:scale-97"
              title="Mudar seu nome espiritual"
            >
              <div className="w-5.5 h-5.5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] text-slate-350 block font-bold leading-none truncate max-w-[120px]">{profile.name}</span>
                <span className="text-[9px] text-amber-500 block mt-0.5 font-mono">Nível {profile.level}</span>
              </div>
            </button>

          </div>

        </div>
      </header>

      {/* Main content slot */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-28">
        
        {/* Render Tab Views with CSS visibility classes so background counters/threads remain working */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <Dashboard 
            habits={habits}
            history={history}
            profile={profile}
            currentDateStr={currentDateStr}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onSaveReflection={handleSaveReflection}
            onCompleteMeditation={handleCompleteMeditation}
          />
        </div>

        <div className={activeTab === 'prayers' ? 'block' : 'hidden'}>
          <PrayersTab 
            prayers={prayers}
            onAddPrayer={handleAddPrayer}
            onDeletePrayer={handleDeletePrayer}
            onReactivatePrayer={handleReactivatePrayer}
            onUpdatePrayer={handleUpdatePrayer}
            currentDateStr={currentDateStr}
          />
        </div>

        <div className={activeTab === 'trophies' ? 'block' : 'hidden'}>
          <TrophiesTab
            profile={profile}
            habits={habits}
            history={history}
          />
        </div>

        <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
          <StatsTab
            habits={habits}
            history={history}
            streak={profile.streak}
            maxStreak={profile.maxStreak}
          />
        </div>

        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <SettingsTab
            onResetApp={handleResetApp}
            showToast={showToast}
          />
        </div>

      </main>

      {/* Floating Bottom Navigation (Aesthetic, Touch Targets >= 44px) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 z-40 max-w-md w-[92%] sm:w-auto">
        
        {/* Início */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs">Início</span>
        </button>

        {/* Orações */}
        <button
          onClick={() => setActiveTab('prayers')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'prayers' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Heart className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs">Orações</span>
        </button>

        {/* Trunfos */}
        <button
          onClick={() => setActiveTab('trophies')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'trophies' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs">Trunfos</span>
        </button>

        {/* Progresso */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stats' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold">Progresso</span>
        </button>

        {/* Ajustes */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold">Ajustes</span>
        </button>
      </nav>

      {/* Global Level Up Modal */}
      <AnimatePresence>
        {showLevelUpModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative"
            >
              <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/25 relative">
                <Sparkles className="w-10 h-10 animate-bounce" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-amber-500/30"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ascensão Espiritual</span>
                <h3 className="text-2xl font-black text-slate-100 mt-1">Evolução de Nível!</h3>
                <p className="text-xs text-slate-400 mt-2 font-sans">
                  Seu compromisso com os propósitos de fé e a reforma íntima elevou sua perseverança a uma nova graça.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Novo Título Espiritual:</span>
                <span className="text-amber-400 font-extrabold text-base block mt-1">
                  Nível {unlockedLevel} — {getLevelTitle(unlockedLevel)}
                </span>
              </div>

              <button
                onClick={() => setShowLevelUpModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-colors active:scale-97 cursor-pointer"
              >
                Seguir em Presença Plena
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Dialog Modal */}
      <AnimatePresence>
        {showRenameModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowRenameModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-500 hover:text-slate-200 border border-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-100">Atualizar Nome de Fé</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Como deseja ser identificado no santuário local</p>
              </div>

              <form onSubmit={handleSaveSpiritualName} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  placeholder="Ex: Irmão Lucas"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-250 focus:border-amber-500/50 focus:outline-none transition-colors"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(false)}
                    className="flex-1 py-2 bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold rounded-xl transition-all hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all"
                  >
                    Salvar Nome
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toasts System */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[90%] pointer-events-none md:w-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-2.5 pointer-events-auto select-none ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 text-emerald-350 border-emerald-500/30'
                  : toast.type === 'error'
                    ? 'bg-rose-950/95 text-rose-350 border-rose-500/30'
                    : 'bg-slate-900/95 text-slate-100 border-slate-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                ) : (
                  <Info className="w-4.5 h-4.5 text-indigo-400" />
                )}
              </div>
              <div className="flex-1 text-xs font-semibold leading-normal whitespace-pre-line tracking-wide font-sans">
                {toast.text}
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-200 p-0.5 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
