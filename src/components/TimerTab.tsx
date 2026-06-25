import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Award,
  BookOpen,
  Bell,
  Flame,
  Info,
  ChevronRight,
  User,
  Power,
  RotateCcw
} from 'lucide-react';
import { AppSettings } from '../types';

interface TimerTabProps {
  onCompleteMeditation: (seconds: number, tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura') => void;
  userIdName?: string;
}

interface SavedTimerState {
  isPlaying: boolean;
  startTime: number | null; // Date.now() timestamp
  accumulatedTime: number; // accumulated seconds in previous plays
  selectedTag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura';
}

const getSavedTimerState = (): SavedTimerState | null => {
  const saved = localStorage.getItem('santuario_timer_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.accumulatedTime === 'number') {
        return parsed;
      }
    } catch (err) {
      console.warn("Error parsing saved timer state:", err);
    }
  }
  return null;
};

export default function TimerTab({ onCompleteMeditation, userIdName }: TimerTabProps) {
  // Load saved state or default
  const initialSavedState = getSavedTimerState();

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    return initialSavedState ? initialSavedState.isPlaying : false;
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    return initialSavedState ? initialSavedState.startTime : null;
  });

  const [accumulatedTime, setAccumulatedTime] = useState<number>(() => {
    return initialSavedState ? initialSavedState.accumulatedTime : 0;
  });

  const [selectedTag, setSelectedTag] = useState<'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura'>(() => {
    return initialSavedState ? initialSavedState.selectedTag : 'aleatorio';
  });

  // Current real-time elapsed seconds
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Guided breathing states
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'still'>('still');
  const [breathTimeline, setBreathTimeline] = useState<number>(0); // 0-16 cycle
  const [enableBreathingGuide, setEnableBreathingGuide] = useState<boolean>(true);

  // Completion modal feedback states
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [sessionDurationCompleted, setSessionDurationCompleted] = useState<number>(0);
  const [sessionTagCompleted, setSessionTagCompleted] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const breathIntervalRef = useRef<number | null>(null);
  const lastSignaledMilestoneRef = useRef<number>(0);

  // Screen Wake Lock API reference
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock is not supported on this platform/browser.');
      return;
    }
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      console.log('Screen Wake Lock active! Screen won\'t dim or turn off.');
    } catch (err) {
      console.warn('Failed to secure Screen Wake Lock:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen Wake Lock released.');
      } catch (err) {
        console.warn('Error releasing Screen Wake Lock:', err);
      }
    }
  };

  // Sound synthesis respecting user global settings
  const playSynthesizedSound = () => {
    const savedSettings = localStorage.getItem('santuario_settings');
    let soundSelection = 'gong';
    let alertVolume = 60;

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        soundSelection = parsed.soundSelection || 'gong';
        alertVolume = typeof parsed.alertVolume === 'number' ? parsed.alertVolume : 60;
      } catch (e) {}
    }

    if (soundSelection === 'none' || alertVolume === 0) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      const now = ctx.currentTime;
      const gainValue = (alertVolume / 100) * 0.4; // normalise volume multiplier

      const playBeep = (freq: number, startDelay: number, duration: number, vol: number, typeStr: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = typeStr;
        osc.frequency.setValueAtTime(freq, now + startDelay);
        
        gainNode.gain.setValueAtTime(0, now + startDelay);
        gainNode.gain.linearRampToValueAtTime(vol, now + startDelay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
        
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration + 0.05);
      };

      if (soundSelection === 'gong') {
        playBeep(220, 0.0, 0.4, gainValue); 
        playBeep(220, 0.15, 0.4, gainValue);
        playBeep(220, 0.30, 0.7, gainValue * 1.1);
      } else if (soundSelection === 'bell') {
        playBeep(523.25, 0.0, 0.15, gainValue * 0.85); 
        playBeep(587.33, 0.1, 0.15, gainValue * 0.85); 
        playBeep(659.25, 0.25, 0.2, gainValue * 0.85); 
        playBeep(783.99, 0.35, 0.4, gainValue * 0.85); 
      } else if (soundSelection === 'bowl') {
        playBeep(440.00, 0.0, 0.12, gainValue * 0.8, 'triangle');
        playBeep(440.00, 0.1, 0.12, gainValue * 0.8, 'triangle');
        playBeep(440.00, 0.2, 0.12, gainValue * 0.8, 'triangle');
        playBeep(554.37, 0.35, 0.5, gainValue * 0.95, 'sine');
      }
    } catch (e) {
      console.log('Audio synthesis is locked by browser/sandbox.', e);
    }
  };

  // Manage Screen Wake Lock during active sessions so screen doesn't turn off
  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Re-acquire Wake Lock when tab becomes active/visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Save the state to localStorage to prevent lost time if browser is closed/suspended
  useEffect(() => {
    const state: SavedTimerState = {
      isPlaying,
      startTime,
      accumulatedTime,
      selectedTag
    };
    localStorage.setItem('santuario_timer_state', JSON.stringify(state));
  }, [isPlaying, startTime, accumulatedTime, selectedTag]);

  // Real-time calculation ticker
  useEffect(() => {
    const calculateTime = () => {
      if (isPlaying && startTime !== null) {
        const secondsSinceStart = Math.floor((Date.now() - startTime) / 1000);
        return accumulatedTime + secondsSinceStart;
      }
      return accumulatedTime;
    };

    // Set initial time
    setTimeElapsed(calculateTime());

    if (isPlaying) {
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = calculateTime();
        setTimeElapsed(elapsed);

        // Check for 10-minute milestones (600 seconds)
        if (elapsed > 0 && elapsed % 600 === 0) {
          const currentMilestone = Math.floor(elapsed / 600);
          if (currentMilestone > lastSignaledMilestoneRef.current) {
            lastSignaledMilestoneRef.current = currentMilestone;
            triggerMilestoneAlert(elapsed);
          }
        }
      }, 250);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, startTime, accumulatedTime]);

  // Reset milestone signaller when time resets
  useEffect(() => {
    if (timeElapsed === 0) {
      lastSignaledMilestoneRef.current = 0;
    } else {
      // In case we restored from a saved state, align the last signaled milestone ref
      lastSignaledMilestoneRef.current = Math.floor(timeElapsed / 600);
    }
  }, [timeElapsed]);

  // Trigger milestone alerts (sound, browser notification, and vibration)
  const triggerMilestoneAlert = (elapsedSecs: number) => {
    // 1. Play Synthesized Sound if enabled
    const savedSettings = localStorage.getItem('santuario_settings');
    let milestoneEnabled = true;
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        milestoneEnabled = parsed.enableMilestoneAlerts !== false;
      } catch (e) {}
    }

    if (milestoneEnabled) {
      playSynthesizedSound();
    }

    // 2. Browser background notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const mins = Math.round(elapsedSecs / 60);
        const tagLabel = tagsList.find(t => t.id === selectedTag)?.label || 'Meditação';
        const tagEmoji = tagsList.find(t => t.id === selectedTag)?.emoji || '🙏';
        new Notification(`⏱️ Marco alcançado: ${mins} Minutos`, {
          body: `Você acaba de completar ${mins} minutos ativos na sua vigília de ${tagLabel}. Continue em comunhão! ${tagEmoji}`,
          icon: '/logoo.png',
          vibrate: [150, 100, 150],
          tag: 'quebar-timer-milestone',
        } as any);
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }

    // 3. Vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }
  };

  // Breathing loop animation sync (16 seconds cycle: 4s inhale, 4s hold, 4s exhale, 4s hold)
  useEffect(() => {
    if (isPlaying && enableBreathingGuide) {
      setBreathPhase('inhale');
      breathIntervalRef.current = window.setInterval(() => {
        setBreathTimeline(prev => {
          const next = (prev + 1) % 16;
          if (next < 4) {
            setBreathPhase('inhale');
          } else if (next < 8) {
            setBreathPhase('hold');
          } else if (next < 12) {
            setBreathPhase('exhale');
          } else {
            setBreathPhase('hold');
          }
          return next;
        });
      }, 1000);
    } else {
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
      }
      setBreathPhase('still');
      setBreathTimeline(0);
    }

    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, [isPlaying, enableBreathingGuide]);

  // Request notification permissions gracefully on play
  const handleStart = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setIsPlaying(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    if (isPlaying && startTime !== null) {
      const elapsedInSession = Math.floor((Date.now() - startTime) / 1000);
      setAccumulatedTime(prev => prev + elapsedInSession);
    }
    setIsPlaying(false);
    setStartTime(null);
  };

  const handleStop = () => {
    // Determine the final seconds
    let finalSeconds = accumulatedTime;
    if (isPlaying && startTime !== null) {
      finalSeconds += Math.floor((Date.now() - startTime) / 1000);
    }

    if (finalSeconds > 0) {
      setSessionDurationCompleted(finalSeconds);
      setSessionTagCompleted(selectedTag);
      setShowCompleteModal(true);

      // Trigger actual database handler on root App.tsx
      onCompleteMeditation(finalSeconds, selectedTag);
    }

    // Fully reset
    setIsPlaying(false);
    setStartTime(null);
    setAccumulatedTime(0);
    setTimeElapsed(0);
    localStorage.removeItem('santuario_timer_state');
  };

  const handleResetWithoutSave = () => {
    setIsPlaying(false);
    setStartTime(null);
    setAccumulatedTime(0);
    setTimeElapsed(0);
    localStorage.removeItem('santuario_timer_state');
  };

  // Format MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getBreathLabel = () => {
    if (breathPhase === 'inhale') return 'Inale lentamente...';
    if (breathPhase === 'hold') return 'Retenha o ar...';
    if (breathPhase === 'exhale') return 'Exale suavemente...';
    return 'Presença Plena';
  };

  const tagsList = [
    { id: 'despertar', label: 'Despertar', emoji: '🌅' },
    { id: 'manha', label: 'Manhã', emoji: '☀️' },
    { id: 'noite', label: 'Noite', emoji: '🌙' },
    { id: 'aleatorio', label: 'Aleatório', emoji: '🎲' },
    { id: 'leitura', label: 'Tempo de Leitura', emoji: '📖' }
  ] as const;

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
          <Clock className="text-amber-500 w-6 h-6" />
          Cronômetro de Vigília e Preces
        </h2>
        <p className="text-slate-400 text-sm">
          A contagem é crescente. Inicie e sintonize-se com Deus. A cada 10 minutos um sinal soará. O tempo continua contando mesmo se você fechar o aplicativo ou desligar a tela.
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TIMER DISPLAY MANDALA (Lg spans 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
          
          {/* Ambient lighting glow */}
          <motion.div 
            animate={{
              scale: breathPhase === 'inhale' ? 1.35 : breathPhase === 'exhale' ? 0.95 : breathPhase === 'hold' ? 1.45 : 1,
              opacity: isPlaying ? 0.15 : 0.04
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 w-72 h-72 blur-3xl pointer-events-none"
          />

          {/* Clock face & progress circle */}
          <div className="relative w-72 h-72 flex items-center justify-center select-none">
            
            {/* Spinning decorative frame when playing */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 270 270"
            >
              <circle
                cx="135"
                cy="135"
                r="118"
                className="stroke-slate-950 fill-transparent stroke-[6]"
              />
              {/* Pulsing indicator segment */}
              <motion.circle
                cx="135"
                cy="135"
                r="118"
                className="stroke-amber-500 fill-transparent stroke-[4]"
                strokeDasharray="20 40 10 30"
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={isPlaying ? { repeat: Infinity, duration: 15, ease: "linear" } : { duration: 0.5 }}
                style={{ transformOrigin: '135px 135px' }}
              />
            </svg>

            {/* Central Clock Display */}
            <motion.div
              animate={{
                scale: breathPhase === 'inhale' ? 1.05 : breathPhase === 'exhale' ? 0.95 : 1,
                borderColor: isPlaying ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.3)'
              }}
              className="absolute w-52 h-52 rounded-full bg-slate-950 border-2 flex flex-col items-center justify-center text-center p-2 shadow-2xl z-20"
            >
              <div className="flex flex-col items-center justify-center mt-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest leading-none select-none mb-1">
                  Tempo Decorrido
                </span>
                
                <span className="text-4xl font-black font-mono tracking-wider text-amber-500 leading-none">
                  {formatTime(timeElapsed)}
                </span>

                {isPlaying ? (
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest mt-2 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    Ativo
                  </span>
                ) : timeElapsed > 0 ? (
                  <span className="text-[9px] text-rose-400 font-extrabold uppercase tracking-widest mt-2">
                    Pausado
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">
                    Pronto
                  </span>
                )}

                <span className="text-[9px] text-slate-400 mt-2.5 font-bold px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800 uppercase tracking-wider">
                  {tagsList.find(t => t.id === selectedTag)?.emoji} {tagsList.find(t => t.id === selectedTag)?.label}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Guided breathing bar */}
          {enableBreathingGuide && isPlaying && (
            <div className="w-full max-w-xs mt-6 text-center space-y-1 z-15">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
                Guia de Respiração Prânica
              </span>
              <p className="text-sm font-semibold text-amber-400/90 tracking-wide font-sans leading-none h-5">
                {getBreathLabel()}
              </p>
              
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1 max-w-[180px] mx-auto border border-slate-850">
                <motion.div 
                  animate={{
                    width: breathPhase === 'inhale' ? '100%' : breathPhase === 'hold' ? '100%' : breathPhase === 'exhale' ? '0%' : '0%'
                  }}
                  transition={{ duration: 4, ease: "linear" }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS & TAG SELECTOR (Lg spans 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Playback Controls Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Controles da Vigília
            </h3>

            <div className="flex flex-col gap-2.5">
              {!isPlaying ? (
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-transform"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  {timeElapsed > 0 ? 'Retomar Contagem' : 'Iniciar Vigília'}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform border border-slate-700/50"
                >
                  <Pause className="w-4 h-4 fill-slate-200" />
                  Pausar Contagem
                </button>
              )}

              {timeElapsed > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStop}
                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Parar &amp; Salvar
                  </button>

                  <button
                    onClick={handleResetWithoutSave}
                    className="py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-450 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Zerar sem Salvar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category Tag Selector */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Categoria da Oração / Prática
            </span>
            <div className="flex flex-col gap-2">
              {tagsList.map(tag => {
                const isSelected = selectedTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    disabled={isPlaying}
                    onClick={() => setSelectedTag(tag.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : isPlaying
                          ? 'bg-slate-950/40 border-slate-900/50 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-250'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{tag.emoji}</span>
                      <span>{tag.label}</span>
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guide toggle card */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Respiração de Foco</span>
              <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">Animar mandala do ritmo prânico de respiração (4-4-4-4).</span>
            </div>
            <button
              onClick={() => setEnableBreathingGuide(!enableBreathingGuide)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-all cursor-pointer flex items-center ${
                enableBreathingGuide ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4.5 h-4.5 bg-slate-950 rounded-full" />
            </button>
          </div>

        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompleteModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-5 shadow-2xl z-50"
            >
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-2xl mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-100 font-sans">
                  Vigília Concluída com Glória!
                </h3>
                <p className="text-slate-400 text-xs">
                  Sua prática espiritual foi gravada com sucesso no diário do templo local.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">Tempo Sintonizado</span>
                  <span className="text-lg font-bold font-mono text-amber-500 mt-1 block">
                    {formatTime(sessionDurationCompleted)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">XP Consagrada</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    +{Math.round(sessionDurationCompleted / 60) * 10} XP
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-450 italic leading-relaxed">
                "Não cesses de falar deste livro da Lei; antes, medita nele dia e noite, para que tenhas cuidado de fazer segundo tudo quanto nele está escrito." — Josué 1:8
              </p>

              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                Glorificar &amp; Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
