import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Plus,
  Cloud,
  CloudOff,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  X,
  Database
} from 'lucide-react';

import { Habit, DayProgress, UserProfile } from './types';
import { DEFAULT_HABITS, LEVEL_THRESHOLDS, getLevelTitle } from './data/defaultData';
import Dashboard from './components/Dashboard';
import TrophiesTab from './components/TrophiesTab';
import StatsTab from './components/StatsTab';
import {
  isAppwriteConfigured,
  getOrCreateUserId,
  saveProfileToAppwrite,
  saveHabitsToAppwrite,
  saveHistoryToAppwrite,
  loadUserDataFromAppwrite,
  listAllProfilesFromAppwrite
} from './lib/appwrite';

// Localstorage keys
const HABITS_STORAGE_KEY = 'santuario_habitos';
const HISTORY_STORAGE_KEY = 'santuario_historico';
const PROFILE_STORAGE_KEY = 'santuario_perfil';

// Format date to local YYYY-MM-DD
// Parse YYYY-MM-DD date string safely without timezone offsets
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
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trophies' | 'stats'>('dashboard');

  // Real-world date tracking
  const currentDateStr = useMemo(() => {
    return formatDate(new Date());
  }, []);

  // States - Direct Synchronous initialization from localStorage for instant, flicker-free rendering
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

  // Appwrite Sync States
  const [userId, setUserId] = useState<string>(() => getOrCreateUserId());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [appwriteConnected, setAppwriteConnected] = useState<boolean>(() => isAppwriteConfigured());
  
  // Backup / Sincronização Modal States
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [backupInputId, setBackupInputId] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Array<{ userId: string; name: string; level: number; xp: number; streak: number; lastActiveDate: string }> | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);

  // Specific refs to skip save-back loops when loading values from the cloud
  const skipHabitsSaveRef = useRef<boolean>(false);
  const skipHistorySaveRef = useRef<boolean>(false);
  const skipProfileSaveRef = useRef<boolean>(false);
  const initialCloudSyncDoneRef = useRef<boolean>(false);

  // Trigger full sync load function
  const triggerAppwriteSync = (targetUserId: string = userId, quiet: boolean = true) => {
    if (!isAppwriteConfigured()) {
      if (!quiet) alert("Appwrite não está configurado com Project ID.");
      return Promise.resolve(false);
    }
    setIsSyncing(true);
    return loadUserDataFromAppwrite(targetUserId).then(cloudData => {
      if (cloudData) {
        skipHabitsSaveRef.current = true;
        skipHistorySaveRef.current = true;
        skipProfileSaveRef.current = true;

        if (cloudData.profile) {
          setProfile(cloudData.profile);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cloudData.profile));
        } else {
          saveProfileToAppwrite(targetUserId, profile);
        }

        if (cloudData.habits) {
          setHabits(cloudData.habits);
          localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(cloudData.habits));
        } else {
          saveHabitsToAppwrite(targetUserId, habits);
        }

        if (cloudData.history) {
          setHistory(cloudData.history);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cloudData.history));
        } else {
          saveHistoryToAppwrite(targetUserId, history);
        }
        setAppwriteConnected(true);
        if (!quiet) alert("Sincronização realizada com sucesso! Seus dados espirituais estão sincronizados na nuvem.");
        return true;
      } else {
        // First sync for a new account: push current local state up to populate cloud
        saveProfileToAppwrite(targetUserId, profile);
        saveHabitsToAppwrite(targetUserId, habits);
        saveHistoryToAppwrite(targetUserId, history);
        setAppwriteConnected(true);
        if (!quiet) alert("Conexão estabelecida! O progresso local foi enviado para o Appwrite para inicializar sua nuvem.");
        return true;
      }
    }).catch(err => {
      console.warn('Appwrite sync failure:', err);
      if (!quiet) alert(`Falha de sincronização: ${err.message || err}`);
      setAppwriteConnected(false);
      return false;
    }).finally(() => {
      setIsSyncing(false);
    });
  };

  // Level up alert state
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  // 1. Initial State Loading from LocalStorage & Appwrite Cloud Backup Sync
  useEffect(() => {
    // Phase B: Fetch from Appwrite in background to load remote database matches
    if (isAppwriteConfigured()) {
      setIsSyncing(true);
      loadUserDataFromAppwrite(userId).then(cloudData => {
        if (cloudData) {
          skipHabitsSaveRef.current = true;
          skipHistorySaveRef.current = true;
          skipProfileSaveRef.current = true;

          if (cloudData.profile) {
            setProfile(cloudData.profile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cloudData.profile));
          } else {
            saveProfileToAppwrite(userId, profile);
          }

          if (cloudData.habits) {
            setHabits(cloudData.habits);
            localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(cloudData.habits));
          } else {
            saveHabitsToAppwrite(userId, habits);
          }

          if (cloudData.history) {
            setHistory(cloudData.history);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cloudData.history));
          } else {
            saveHistoryToAppwrite(userId, history);
          }

          setAppwriteConnected(true);
        } else {
          // Empty or new remote profile -> automatically push our data to cloud on start
          saveProfileToAppwrite(userId, profile);
          saveHabitsToAppwrite(userId, habits);
          saveHistoryToAppwrite(userId, history);
          setAppwriteConnected(true);
        }
      }).catch(err => {
        console.warn('Appwrite cloud synchronization missed or offline:', err);
        setAppwriteConnected(false); // Display red cloud when offline or network fails
      }).finally(() => {
        setIsSyncing(false);
        initialCloudSyncDoneRef.current = true; // Mark initialization completed!
      });
    } else {
      // If Appwrite is not configured, we are fully initialized locally
      initialCloudSyncDoneRef.current = true;
    }
  }, [userId]);

  // 2. Persistent saving engine triggers whenever local React state updates
  useEffect(() => {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    if (skipHabitsSaveRef.current) {
      skipHabitsSaveRef.current = false;
      return;
    }
    if (initialCloudSyncDoneRef.current && appwriteConnected && isAppwriteConfigured()) {
      saveHabitsToAppwrite(userId, habits);
    }
  }, [habits, userId, appwriteConnected]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    if (skipHistorySaveRef.current) {
      skipHistorySaveRef.current = false;
      return;
    }
    if (initialCloudSyncDoneRef.current && appwriteConnected && isAppwriteConfigured()) {
      saveHistoryToAppwrite(userId, history);
    }
  }, [history, userId, appwriteConnected]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (skipProfileSaveRef.current) {
      skipProfileSaveRef.current = false;
      return;
    }
    if (initialCloudSyncDoneRef.current && appwriteConnected && isAppwriteConfigured()) {
      saveProfileToAppwrite(userId, profile);
    }
  }, [profile, userId, appwriteConnected]);

  // 3. Recalculate streak values dynamically from history completions database whenever it updates
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

  // Import past cloud backup data using custom Backup/Synchronization ID
  const handleImportBackupId = (targetId: string) => {
    const cleanId = targetId.trim();
    if (!cleanId) {
      setBackupStatusMessage({ text: 'Por favor, informe um código de sincronização válido.', type: 'error' });
      return;
    }
    
    setIsSyncing(true);
    setBackupStatusMessage({ text: 'Buscando dados espirituais na nuvem...', type: 'info' });
    
    loadUserDataFromAppwrite(cleanId).then(cloudData => {
      if (cloudData) {
        // Marcamos as salvaguardas para não sobrescrever a nuvem com dados em branco locais no meio do set
        skipHabitsSaveRef.current = true;
        skipHistorySaveRef.current = true;
        skipProfileSaveRef.current = true;
        
        // Atualiza a chave local e o estado de ID global
        localStorage.setItem('santuario_uid', cleanId);
        setUserId(cleanId);
        
        if (cloudData.profile) {
          setProfile(cloudData.profile);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cloudData.profile));
        }
        if (cloudData.habits) {
          setHabits(cloudData.habits);
          localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(cloudData.habits));
        }
        if (cloudData.history) {
          setHistory(cloudData.history);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cloudData.history));
        }
        
        setAppwriteConnected(true);
        setBackupStatusMessage({ text: 'Santuário sintonizado! Seus dados e seu histórico anterior foram carregados com sucesso!', type: 'success' });
      } else {
        // Registro de ID inexistente mas válido para sessões futuras
        localStorage.setItem('santuario_uid', cleanId);
        setUserId(cleanId);
        
        saveProfileToAppwrite(cleanId, profile);
        saveHabitsToAppwrite(cleanId, habits);
        saveHistoryToAppwrite(cleanId, history);
        
        setAppwriteConnected(true);
        setBackupStatusMessage({ text: 'Nenhum dado encontrado para esse código. Um novo templo de orações foi criado na nuvem com este código!', type: 'success' });
      }
    }).catch(err => {
      console.warn('Appwrite sync import failed:', err);
      setBackupStatusMessage({ text: `Ops, erro ao resgatar histórico: ${err.message || 'Verifique seus dados de rede.'}`, type: 'error' });
    }).finally(() => {
      setIsSyncing(false);
    });
  };

  const fetchAvailableProfiles = () => {
    if (!isAppwriteConfigured()) return;
    setIsLoadingProfiles(true);
    listAllProfilesFromAppwrite()
      .then(profiles => {
        setAvailableProfiles(profiles);
      })
      .catch(err => {
        console.warn('Erro ao carregar perfis do Appwrite:', err);
      })
      .finally(() => {
        setIsLoadingProfiles(false);
      });
  };

  useEffect(() => {
    if (showBackupModal) {
      fetchAvailableProfiles();
    }
  }, [showBackupModal]);

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

    // Get unique list of days with completed habits, meditation, or journal reflections sorted descending
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

    // Verify if last active has been today or yesterday. If more than 1 day slip occurred, streak is broken
    const lastActive = activeDays[0];
    if (lastActive !== todayStr && lastActive !== yesterdayStr) {
      return { streak: 0, max: profile.maxStreak };
    }

    // Loop through sorted days to find continuous streak count
    let currentStreak = 1;
    let checker = parseLocalDate(lastActive);
    const activeDaysSet = new Set(activeDays);

    while (true) {
      // Subtract 1 day from checker safely in local time
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

    setProfile(prev => ({
      ...prev,
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
    setProfile(prev => ({
      ...prev,
      lastActiveDate: currentDateStr
    }));
  };

  // Concluding a meditation countdown timer
  const handleCompleteMeditation = (seconds: number, tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura' = 'aleatorio') => {
    let existingEntryIndex = history.findIndex(entry => entry.date === currentDateStr);
    let updatedHistory = [...history];

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

    // Dynamic XP Reward: 10 XP per minute completed
    const minutesCompleted = Math.round(seconds / 60);
    const xpReward = minutesCompleted * 10;
    addXP(xpReward);

    setProfile(prev => ({
      ...prev,
      lastActiveDate: currentDateStr
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Name */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-center p-0.5">
              <img src="/logoo.png" alt="Logo QUEBAR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-slate-100 font-sans">QUEBAR</h1>
              <span className="text-[10px] text-slate-400 block leading-none font-medium">Caminhada Cristã &amp; Hábitos</span>
            </div>
          </div>

          {/* Quick Profile stats */}
          <div className="flex items-center gap-2 sm:gap-4">            {/* Appwrite status indicator */}
            <button
              onClick={() => {
                setBackupInputId('');
                setBackupStatusMessage(null);
                setShowBackupModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                appwriteConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
              }`}
              title="Gerenciar Sincronização na Nuvem"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : appwriteConnected ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              )}
              <span className="hidden sm:inline">
                {isSyncing ? 'Sincronizando...' : appwriteConnected ? 'Sincronizado' : 'Offline'}
              </span>
            </button>

            <button 
              id="btn-profile"
              onClick={() => {
                setBackupInputId('');
                setBackupStatusMessage(null);
                setShowBackupModal(true);
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-900 transition-colors cursor-pointer text-left"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden md:block">
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
        
        {/* Render Tab Views with CSS visibility classes so components like Timer keep working in background */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <Dashboard 
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

      {/* Painel de Perfil e Sincronização na Nuvem em Modal */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative text-left"
            >
              {/* Botão Fechar no canto */}
              <button
                id="btn-close-backup-modal"
                onClick={() => setShowBackupModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-500 hover:text-slate-200 border border-slate-850 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/65">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Painel de Perfil &amp; Backup</h3>
                  <p className="text-[9px] text-slate-500 font-mono">Gerencie suas preces e integridade dos dados</p>
                </div>
              </div>

              {/* Seção 1: Identidade */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Seu Nome Espiritual</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => {
                    setProfile(prev => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Seu nome"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors font-sans"
                />
              </div>

              {/* Seção 2: Código de Sincronização Atual */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
                    Seu Código de Sincronização
                  </span>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1 font-sans">
                    Guarde este código para resgatar suas preces e progresso se limpar o histórico do navegador ou se mudar de dispositivo.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={userId}
                    className="flex-1 bg-slate-950/90 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono text-center select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userId);
                      setCopyFeedback(true);
                      setTimeout(() => setCopyFeedback(false), 2000);
                    }}
                    className="px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copyFeedback ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Seção 3: Importar Dados Anteriores / Resgatar */}
              <div className="space-y-2 pt-1 font-sans">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Recuperar Orações Anteriores</label>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                    Cole o código de sincronização que usou no outro dia para carregar todo o seu histórico no Appwrite.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={backupInputId}
                    onChange={(e) => setBackupInputId(e.target.value)}
                    placeholder="Ex: usr12abc..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono transition-colors"
                  />
                  <button
                    onClick={() => handleImportBackupId(backupInputId)}
                    disabled={isSyncing}
                    className="px-4.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-xs rounded-xl hover:shadow-md transition-colors cursor-pointer active:scale-97 flex items-center gap-1.5 justify-center"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Resgatar'}
                  </button>
                </div>
              </div>

              {/* Seção 4: Contas Encontradas no Servidor para Resgate Fácil */}
              <div className="space-y-2 pt-2.5 font-sans border-t border-slate-800/50">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">
                    Templos de Orações na Nuvem
                  </label>
                  <button 
                    onClick={fetchAvailableProfiles}
                    disabled={isLoadingProfiles}
                    className="text-[10px] text-amber-500 hover:underline font-bold bg-transparent border-0 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoadingProfiles ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>
                
                {isLoadingProfiles ? (
                  <div className="text-center py-3">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-500/40" />
                    <p className="text-[9px] text-slate-500 mt-1">Lendo do Appwrite...</p>
                  </div>
                ) : availableProfiles && availableProfiles.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {availableProfiles.map((p) => {
                      const isCurrent = p.userId === userId;
                      return (
                        <div 
                          key={p.userId} 
                          className={`p-2 rounded-xl text-left flex justify-between items-center text-xs transition-all border ${
                            isCurrent 
                              ? 'bg-amber-500/5 border-amber-500/20' 
                              : 'bg-slate-950 border border-slate-850 hover:border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-1.5">
                            <span className="font-bold text-slate-200 block truncate leading-tight">
                              {p.name || 'Praticante Anônimo'} {isCurrent && <span className="text-[9px] text-amber-500 font-normal">(Atual)</span>}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono block">
                              Ofensiva: {p.streak} d • Nvl {p.level} • XP: {p.xp}
                            </span>
                          </div>
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                handleImportBackupId(p.userId);
                              }}
                              className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg hover:bg-amber-400 cursor-pointer text-center whitespace-nowrap active:scale-95 transition-transform"
                            >
                              Sintonizar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-500 italic text-center py-2 bg-slate-950/45 rounded-lg border border-slate-850/30">
                    Nenhum outro templo de preces encontrado na nuvem para este projeto.
                  </p>
                )}
              </div>

              {/* Mensagem de Feedback de Backup */}
              {backupStatusMessage && (
                <div className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed font-sans ${
                  backupStatusMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : backupStatusMessage.type === 'error' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                }`}>
                  {backupStatusMessage.text}
                </div>
              )}

              {/* Botão de Rodapé */}
              <button
                id="btn-close-backup-footer"
                onClick={() => setShowBackupModal(false)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-850 hover:text-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Concluir &amp; Voltar ao Santuário
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
