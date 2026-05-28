import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp, 
  User, 
  Sparkles,
  ChevronRight,
  Flame,
  Info,
  Heart,
  Plus
} from 'lucide-react';

import { Habit, DayProgress, UserProfile } from './types';
import { DEFAULT_HABITS, LEVEL_THRESHOLDS, getLevelTitle } from './data/defaultData';
import Dashboard from './components/Dashboard';
import TrophiesTab from './components/TrophiesTab';
import StatsTab from './components/StatsTab';

// Localstorage keys
const HABITS_STORAGE_KEY = 'santuario_habitos';
const HISTORY_STORAGE_KEY = 'santuario_historico';
const PROFILE_STORAGE_KEY = 'santuario_perfil';

// Format date to local YYYY-MM-DD
function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trophies' | 'stats'>('dashboard');

  // Custom simulation date (allows users/testers to skip days to test streaks!)
  const [simulationOffset, setSimulationOffset] = useState<number>(0);
  const currentDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + simulationOffset);
    return formatDate(d);
  }, [simulationOffset]);

  // States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<DayProgress[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    level: 1,
    xp: 0,
    streak: 0,
    maxStreak: 0,
    lastActiveDate: currentDateStr,
    notificationPreferences: {
      enabled: true,
      morningTime: '07:00',
      eveningTime: '21:00'
    }
  });

  // Level up alert state
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  // 1. Initial State Loading from LocalStorage
  useEffect(() => {
    const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    } else {
      setHabits(DEFAULT_HABITS);
    }

    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    } else {
      // Create empty historical data
      setHistory([]);
    }

    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
    } else {
      // Create fresh user profile
      const defaultProfile: UserProfile = {
        name: 'Praticante Espiritual',
        level: 1,
        xp: 0,
        streak: 0,
        maxStreak: 0,
        lastActiveDate: currentDateStr,
        notificationPreferences: {
          enabled: true,
          morningTime: '07:00',
          eveningTime: '21:00'
        }
      };
      setProfile(defaultProfile);
    }
  }, []);

  // 2. Persistent saving engine triggers whenever state updates
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (history.length >= 0) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (profile.xp >= 0) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  // Level Up logic validator: Analyzes XP modifications and transitions levels
  const checkLevelUp = (currentXP: number, previousLevel: number) => {
    // Determine target level from LEVEL_THRESHOLDS
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

  // Safe global XP adder wrapper
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

  // Streak Recalculation authority: looks at actual completions history to calculate streaks
  const runStreakUpdate = (currentHis: DayProgress[], currentDate: string) => {
    if (currentHis.length === 0) return { streak: 0, max: profile.maxStreak };

    // Get unique list of days with completed habits sorted descending
    const activeDays = currentHis
      .filter(day => day.habitsCompleted && day.habitsCompleted.length > 0)
      .map(day => day.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (activeDays.length === 0) return { streak: 0, max: profile.maxStreak };

    const todayDate = new Date(currentDate);
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);
    
    const todayStr = currentDate;
    const yesterdayStr = formatDate(yesterdayDate);

    // Verify if last active has been today or yesterday. If more than 1 day slip occurred, streak is broken
    const lastActive = activeDays[0];
    if (lastActive !== todayStr && lastActive !== yesterdayStr) {
      return { streak: 0, max: profile.maxStreak };
    }

    // Loop through sorted days to find continuous streak count
    let currentStreak = 1;
    let checker = new Date(lastActive);

    for (let i = 1; i < activeDays.length; i++) {
      // Subtract 1 day from checker
      checker.setDate(checker.getDate() - 1);
      const checkerStr = formatDate(checker);
      
      if (activeDays.includes(checkerStr)) {
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

  // Toggle single habit completion status on the current simulated date
  const handleToggleHabit = (habitId: string) => {
    let xpDiff = 0;
    
    // Find or construct the DayProgress entry in history
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);
    let updatedHistory = [...history];

    if (existingEntryIndex !== -1) {
      const entry = updatedHistory[existingEntryIndex];
      const hasCompleted = entry.habitsCompleted.includes(habitId);
      
      let updatedCompletions = [];
      if (hasCompleted) {
        // Unchecking
        updatedCompletions = entry.habitsCompleted.filter(id => id !== habitId);
        xpDiff = -15; // Deduct XP if they undo
      } else {
        // Checking
        updatedCompletions = [...entry.habitsCompleted, habitId];
        xpDiff = 15;
      }

      updatedHistory[existingEntryIndex] = {
        ...entry,
        habitsCompleted: updatedCompletions
      };
    } else {
      // Create new day log entry
      updatedHistory.push({
        date: currentDateStr,
        habitsCompleted: [habitId],
        meditationSeconds: 0
      });
      xpDiff = 15;
    }

    // Save history
    setHistory(updatedHistory);
    
    // Apply score / XP
    if (xpDiff !== 0) {
      addXP(xpDiff);
    }

    // Refresh streak values recursively
    const streakResult = runStreakUpdate(updatedHistory, currentDateStr);

    setProfile(prev => ({
      ...prev,
      streak: streakResult.streak,
      maxStreak: streakResult.max,
      lastActiveDate: currentDateStr
    }));
  };

  // Creating a new habit
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
  };

  // Deleting a habit
  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    
    // Clean completed occurrences from history entries
    setHistory(prev => prev.map(day => ({
      ...day,
      habitsCompleted: day.habitsCompleted.filter(id => id !== habitId)
    })));
  };

  // Committing journal/reflection note
  const handleSaveReflection = (text: string) => {
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);
    let updatedHistory = [...history];

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
    // Add 10 XP for writing in the devotional journal!
    addXP(10);
  };

  // Concluding a meditation countdown timer
  const handleCompleteMeditation = (seconds: number) => {
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);
    let updatedHistory = [...history];

    if (existingEntryIndex !== -1) {
      const entry = updatedHistory[existingEntryIndex];
      updatedHistory[existingEntryIndex] = {
        ...entry,
        meditationSeconds: (entry.meditationSeconds || 0) + seconds
      };
    } else {
      updatedHistory.push({
        date: currentDateStr,
        habitsCompleted: [],
        meditationSeconds: seconds
      });
    }

    setHistory(updatedHistory);

    // Dynamic XP Reward: 10 XP per minute completed
    const minutesCompleted = Math.round(seconds / 60);
    const xpReward = minutesCompleted * 10;
    addXP(xpReward);

    // Refresh streak
    const streakResult = runStreakUpdate(updatedHistory, currentDateStr);
    setProfile(prev => ({
      ...prev,
      streak: streakResult.streak,
      maxStreak: streakResult.max,
      lastActiveDate: currentDateStr
    }));
  };

  // Allowing simple manual name change
  const handleProfileNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    const promptName = window.prompt("Como deseja ser chamado em sua caminhada?", profile.name);
    if (promptName && promptName.trim()) {
      setProfile(prev => ({
        ...prev,
        name: promptName.trim()
      }));
    }
  };

  // Simulated timezone rollover (advances physical date inside state by 1 day)
  const advanceToNextDay = () => {
    setSimulationOffset(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-xl shadow-md">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-slate-100 font-sans">QUEBAR</h1>
              <span className="text-[10px] text-slate-400 block leading-none font-medium">Caminhada Cristã &amp; Hábitos</span>
            </div>
          </div>

          {/* Quick Profile stats */}
          <div className="flex items-center gap-4">
            {/* Simulation Dev Tools */}
            <button
              id="btn-simulate-day"
              onClick={advanceToNextDay}
              className="text-[10px] font-semibold text-slate-500 hover:text-amber-500 bg-slate-950 hover:bg-slate-900 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-900 transition-all flex items-center gap-1 cursor-pointer"
              title="Simule o próximo dia útil para testar recorrências e medalhas"
            >
              <span className="hidden xs:inline sm:inline">Avançar de Dia</span>
              <span className="inline xs:hidden sm:hidden">+1 Dia</span> ➔
            </button>

            <button 
              id="btn-profile"
              onClick={handleProfileNameChange}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-900 transition-colors cursor-pointer text-left"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] text-slate-400 block font-semibold leading-none">{profile.name || 'Definir Nome'}</span>
                <span className="text-[9px] text-amber-500 block mt-0.5 font-mono">Nível {profile.level}</span>
              </div>
            </button>

            {/* Streak Counter */}
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span className="font-mono">{profile.streak}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        
        {/* Render Tab Views Dynamically */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              key="dash"
              habits={habits}
              history={history}
              profile={profile}
              currentDateStr={currentDateStr}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
              onCompleteMeditation={handleCompleteMeditation}
              onSaveReflection={handleSaveReflection}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'trophies' && (
            <TrophiesTab
              key="trophies"
              profile={profile}
              habits={habits}
              history={history}
            />
          )}

          {activeTab === 'stats' && (
            <StatsTab
              key="stats"
              habits={habits}
              history={history}
              streak={profile.streak}
              maxStreak={profile.maxStreak}
            />
          )}
        </AnimatePresence>

      </main>

      {/* Floating Bottom Navigation Tab bar (Extremely elegant, touch target maximized) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 z-40 max-w-sm w-[92%] sm:w-auto">
        <button
          id="tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Compass className="w-4.5 h-4.5" />
          <span className="text-[11px] sm:text-xs">Início</span>
        </button>

        <button
          id="tab-trophies"
          onClick={() => setActiveTab('trophies')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'trophies' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span className="text-[11px] sm:text-xs">Trunfos</span>
        </button>

        <button
          id="tab-stats"
          onClick={() => setActiveTab('stats')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stats' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span className="text-[11px] sm:text-xs font-semibold">Progresso</span>
        </button>
      </nav>

      {/* Global Level Up Modal Feedback */}
      <AnimatePresence>
        {showLevelUpModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative"
            >
              {/* Floating elements animation */}
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
                <p className="text-xs text-slate-400 mt-2">
                  Seu compromisso com a luz e a reforma íntima elevou sua mentalidade para uma nova vibração.
                </p>
              </div>

              {/* Title announcement */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Novo Título Espiritual:</span>
                <span className="text-amber-400 font-extrabold text-base block mt-1">
                  Nível {unlockedLevel} — {getLevelTitle(unlockedLevel)}
                </span>
              </div>

              <button
                id="btn-level-close"
                onClick={() => setShowLevelUpModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-colors active:scale-97 cursor-pointer"
              >
                Seguir em Presença Plena
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
