import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Award,
  ChevronRight,
  TrendingUp,
  Sliders,
  Compass,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { TimerPreset } from '../types';
import { TIMER_PRESETS } from '../data/defaultData';

interface TimerTabProps {
  key?: string;
  onCompleteMeditation: (seconds: number, tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura') => void;
  userIdName?: string;
}

export default function TimerTab({ onCompleteMeditation, userIdName }: TimerTabProps) {
  // Configurable states
  const [duration, setDuration] = useState<number>(600); // 10 minutes default (600s)
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customSeconds, setCustomSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [soundSelection, setSoundSelection] = useState<'gong' | 'bell' | 'bowl' | 'none'>('gong');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Moment Tag state
  const [selectedTag, setSelectedTag] = useState<'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura'>('aleatorio');

  // Guided breathing states
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'still'>('still');
  const [breathTimeline, setBreathTimeline] = useState<number>(0); // 0-16 cycle

  // Completion modal / feedback overlay state
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [finishedDuration, setFinishedDuration] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const breathIntervalRef = useRef<number | null>(null);
  
  // Real-world countdown wall-clock calculations
  const endTimeRef = useRef<number | null>(null);
  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);
  const secondsScrollRef = useRef<HTMLDivElement>(null);

  // States & Refs for looping end alert sound until explicitly silenced
  const [isSoundLooping, setIsSoundLooping] = useState<boolean>(false);
  const soundIntervalRef = useRef<number | null>(null);

  const stopLoopingSound = () => {
    setIsSoundLooping(false);
    if (soundIntervalRef.current) {
      window.clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        window.clearInterval(soundIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (breathIntervalRef.current) {
        window.clearInterval(breathIntervalRef.current);
      }
    };
  }, []);

  // Sync remaining seconds with duration if not running and duration changed
  useEffect(() => {
    if (!isPlaying && !hasStarted) {
      setTimeLeft(duration);
    }
  }, [duration, isPlaying, hasStarted]);

  // Clean end time reference when timer is paused or stopped
  useEffect(() => {
    if (!isPlaying) {
      endTimeRef.current = null;
    }
  }, [isPlaying]);

  // Sync scroll locations for Hours, Minutes, and Seconds wheels
  useEffect(() => {
    if (!isPlaying) {
      const itemHeight = 32;
      if (hoursScrollRef.current) {
        const targetTop = customHours * itemHeight;
        if (Math.abs(hoursScrollRef.current.scrollTop - targetTop) > 3) {
          hoursScrollRef.current.scrollTop = targetTop;
        }
      }
      if (minutesScrollRef.current) {
        const targetTop = customMinutes * itemHeight;
        if (Math.abs(minutesScrollRef.current.scrollTop - targetTop) > 3) {
          minutesScrollRef.current.scrollTop = targetTop;
        }
      }
      if (secondsScrollRef.current) {
        const targetTop = customSeconds * itemHeight;
        if (Math.abs(secondsScrollRef.current.scrollTop - targetTop) > 3) {
          secondsScrollRef.current.scrollTop = targetTop;
        }
      }
    }
  }, [customHours, customMinutes, customSeconds, isPlaying]);

  // Audio synthesis engine using standard AudioContext
  // Plays satisfying bell/gong frequencies without needing external loaded assets
  const playSynthesizedSound = (type: 'gong' | 'bell' | 'bowl') => {
    if (isMuted) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      const now = ctx.currentTime;

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

      if (type === 'gong') {
        // Insistent triple deep chimes (spaced 150ms apart)
        playBeep(220, 0.0, 0.4, 0.35); // A3
        playBeep(220, 0.15, 0.4, 0.35);
        playBeep(220, 0.30, 0.7, 0.4);
      } else if (type === 'bell') {
        // Rapid double plim-plim ring repeated (4 chimes)
        playBeep(523.25, 0.0, 0.15, 0.3); // C5
        playBeep(587.33, 0.1, 0.15, 0.3); // D5
        playBeep(659.25, 0.25, 0.2, 0.3); // E5
        playBeep(783.99, 0.35, 0.4, 0.3); // G5
      } else if (type === 'bowl') {
        // High pitch urgent rhythmic sequence (Plim Plim Plim!)
        playBeep(440.00, 0.0, 0.12, 0.3, 'triangle');
        playBeep(440.00, 0.1, 0.12, 0.3, 'triangle');
        playBeep(440.00, 0.2, 0.12, 0.3, 'triangle');
        playBeep(554.37, 0.35, 0.5, 0.35, 'sine');
      }
    } catch (e) {
      console.log('Audio synthesis is locked by browser/sandbox.', e);
    }
  };

  // Breathing loop animation sync (16 seconds cycle: 4s inhale, 4s hold, 4s exhale, 4s hold)
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying]);

  // Main countdown scheduler using wall-clock calculation to prevent timer skips or pauses in browser sleep mode
  useEffect(() => {
    if (isPlaying) {
      if (endTimeRef.current === null) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      timerIntervalRef.current = window.setInterval(() => {
        if (endTimeRef.current !== null) {
          const now = Date.now();
          const target = endTimeRef.current;
          const diffSeconds = Math.max(0, Math.ceil((target - now) / 1000));

          setTimeLeft(diffSeconds);

          if (diffSeconds <= 0) {
            // Done! Complete sequence
            setIsPlaying(false);
            setHasStarted(false);
            setFinishedDuration(duration);
            setShowCompleteModal(true);
            onCompleteMeditation(duration, selectedTag);
            
            // Loop sound alert continuously until explicitly canceled
            if (soundSelection !== 'none') {
              setIsSoundLooping(true);
              playSynthesizedSound(soundSelection);
              if (soundIntervalRef.current) window.clearInterval(soundIntervalRef.current);
              soundIntervalRef.current = window.setInterval(() => {
                playSynthesizedSound(soundSelection);
              }, 2000);
            }
            
            endTimeRef.current = null;
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          }
        }
      }, 200);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, duration, soundSelection, onCompleteMeditation, selectedTag, timeLeft]);

  // Handle setting preset values
  const handlePresetSelect = (minutesVal: number) => {
    setIsPlaying(false);
    setHasStarted(false);
    const h = Math.floor(minutesVal / 60);
    const m = minutesVal % 60;
    const s = 0;
    setCustomHours(h);
    setCustomMinutes(m);
    setCustomSeconds(s);
    setDuration(minutesVal * 60);
    setTimeLeft(minutesVal * 60);
  };

  // Scroll wheel events
  const handleScrollHours = (e: React.UIEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 32;
    const computedIndex = Math.round(scrollTop / itemHeight);
    const val = Math.max(0, Math.min(23, computedIndex));
    if (val !== customHours) {
      setHasStarted(false);
      setCustomHours(val);
      const newDuration = val * 3600 + customMinutes * 60 + customSeconds;
      setDuration(newDuration);
      setTimeLeft(newDuration);
    }
  };

  const handleScrollMinutes = (e: React.UIEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 32;
    const computedIndex = Math.round(scrollTop / itemHeight);
    const val = Math.max(0, Math.min(59, computedIndex));
    if (val !== customMinutes) {
      setHasStarted(false);
      setCustomMinutes(val);
      const newDuration = customHours * 3600 + val * 60 + customSeconds;
      setDuration(newDuration);
      setTimeLeft(newDuration);
    }
  };

  const handleScrollSeconds = (e: React.UIEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 32;
    const computedIndex = Math.round(scrollTop / itemHeight);
    const val = Math.max(0, Math.min(59, computedIndex));
    if (val !== customSeconds) {
      setHasStarted(false);
      setCustomSeconds(val);
      const newDuration = customHours * 3600 + customMinutes * 60 + val;
      setDuration(newDuration);
      setTimeLeft(newDuration);
    }
  };

  // Play test gongs
  const testAlertSound = () => {
    playSynthesizedSound(soundSelection);
  };

  // Format HH:MM:SS or MM:SS depending on hours
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress circle SVG calculation
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = duration > 0 ? (timeLeft / duration) : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Breath phrase text labels
  const getBreathLabel = () => {
    if (breathPhase === 'inhale') return 'Inale lentamente...';
    if (breathPhase === 'hold') return 'Retenha o ar...';
    if (breathPhase === 'exhale') return 'Exale suavemente...';
    return 'Presença Plena';
  };

  // Generate options for custom wheels
  const hoursOptions = Array.from({ length: 24 }, (_, idx) => idx);
  const minutesOptions = Array.from({ length: 60 }, (_, idx) => idx);
  const secondsOptions = Array.from({ length: 60 }, (_, idx) => idx);

  // Emojis for tags
  const tagsList = [
    { id: 'despertar', label: 'Despertar', emoji: '🌅' },
    { id: 'manha', label: 'Manhã', emoji: '☀️' },
    { id: 'noite', label: 'Noite', emoji: '🌙' },
    { id: 'aleatorio', label: 'Aleatório', emoji: '🎲' },
    { id: 'leitura', label: 'Tempo de Leitura', emoji: '📖' }
  ] as const;

  const quickDurations = [5, 10, 20, 30, 60] as const;

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
          Vigília e Oração de Silêncio
        </h2>
        <p className="text-slate-400 text-sm">
          Ajuste o tempo utilizando a roda de rolagem e selecione a categoria correspondente para registrar e conquistar medalhas espirituais.
        </p>
      </div>

      {/* Main Grid: Left is Interactive Mandala Timer, Right is Customizer Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TIMER DISPLAY MANDALA (Lg spans 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
          {/* Faint ambient light glow expanding according to breathing phase */}
          <motion.div 
            animate={{
              scale: breathPhase === 'inhale' ? 1.3 : breathPhase === 'exhale' ? 0.95 : breathPhase === 'hold' ? 1.4 : 1,
              opacity: breathPhase === 'still' ? 0.05 : 0.12
            }}
            transition={{ duration: breathPhase === 'hold' ? 4 : 3.5, ease: "easeInOut" }}
            className="absolute rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 w-72 h-72 blur-3xl pointer-events-none"
          />

          {/* Elegant Circular Progress with Interactive Center */}
          <div 
            className="relative w-72 h-72 flex items-center justify-center select-none"
          >
            {/* SVG circle stroke */}
            <svg 
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" 
              viewBox="0 0 270 270"
            >
              {/* Slate Outer ring */}
              <circle
                cx="135"
                cy="135"
                r={radius}
                className="stroke-slate-950 fill-transparent stroke-[6]"
              />
              {/* Inner highlight representing remaining progress */}
              <motion.circle
                cx="135"
                cy="135"
                r={radius}
                className="stroke-amber-400 fill-transparent stroke-[6] stroke-linecap-round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: isPlaying ? 0.5 : 0.3 }}
              />
            </svg>

            {/* Central Breath Sphere */}
            <motion.div
              animate={{
                scale: breathPhase === 'inhale' ? 1.08 : breathPhase === 'exhale' ? 0.90 : breathPhase === 'hold' ? 1.15 : 1,
                borderColor: breathPhase === 'hold' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.3)'
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute w-52 h-52 rounded-full bg-slate-950 border-2 flex flex-col items-center justify-center text-center p-2 shadow-2xl z-20"
            >
              {hasStarted ? (
                <div className="flex flex-col items-center justify-center mt-1">
                  <span className="text-4xl font-black font-mono tracking-wider text-amber-500 selection:bg-transparent leading-none">
                    {formatTime(timeLeft)}
                  </span>
                  {!isPlaying && (
                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1.5 animate-pulse select-none">
                      Pausado
                    </span>
                  )}
                  {selectedTag && (
                    <span className="text-[9px] text-slate-500 mt-2 font-bold px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800 uppercase tracking-wider">
                      {tagsList.find(t => t.id === selectedTag)?.emoji} {tagsList.find(t => t.id === selectedTag)?.label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full p-2">
                  {/* Triple Wheel/Scroll style picker */}
                  <div className="relative w-[150px] h-[80px] overflow-hidden flex items-center justify-center gap-1 font-mono">
                    
                    {/* Centered Guide Borders */}
                    <div className="absolute left-0 right-0 top-[24px] h-[32px] border-y border-amber-500/20 bg-amber-500/5 pointer-events-none" />
                    
                    {/* Fading backgrounds */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10" />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
                    
                    {/* Wheel 1: Hours */}
                    <div className="w-[45px] h-full relative">
                      <div 
                        ref={hoursScrollRef}
                        onScroll={handleScrollHours}
                        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center"
                      >
                        <div className="h-[24px]" />
                        {hoursOptions.map(h => {
                          const isChosen = h === customHours;
                          return (
                            <div
                              key={`h-${h}`}
                              onClick={() => {
                                setCustomHours(h);
                                const newDuration = h * 3600 + customMinutes * 60 + customSeconds;
                                setDuration(newDuration);
                              }}
                              className={`h-[32px] w-full flex items-center justify-center snap-center select-none cursor-pointer transition-all ${
                                isChosen 
                                  ? 'text-[18px] text-amber-400 font-black scale-110 leading-none font-mono' 
                                  : 'text-[11px] text-slate-600 hover:text-slate-400 opacity-40 leading-none font-mono'
                              }`}
                            >
                              {String(h).padStart(2, '0')}
                            </div>
                          );
                        })}
                        <div className="h-[24px]" />
                      </div>
                    </div>

                    {/* Divider */}
                    <span className="text-slate-500 font-bold text-xs select-none mb-1">:</span>

                    {/* Wheel 2: Minutes */}
                    <div className="w-[45px] h-full relative">
                      <div 
                        ref={minutesScrollRef}
                        onScroll={handleScrollMinutes}
                        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center"
                      >
                        <div className="h-[24px]" />
                        {minutesOptions.map(m => {
                          const isChosen = m === customMinutes;
                          return (
                            <div
                              key={`m-${m}`}
                              onClick={() => {
                                setCustomMinutes(m);
                                const newDuration = customHours * 3600 + m * 60 + customSeconds;
                                setDuration(newDuration);
                              }}
                              className={`h-[32px] w-full flex items-center justify-center snap-center select-none cursor-pointer transition-all ${
                                isChosen 
                                  ? 'text-[18px] text-amber-500 font-black scale-110 leading-none font-mono' 
                                  : 'text-[11px] text-slate-600 hover:text-slate-400 opacity-40 leading-none font-mono'
                              }`}
                            >
                              {String(m).padStart(2, '0')}
                            </div>
                          );
                        })}
                        <div className="h-[24px]" />
                      </div>
                    </div>

                    {/* Divider */}
                    <span className="text-slate-500 font-bold text-xs select-none mb-1">:</span>

                    {/* Wheel 3: Seconds */}
                    <div className="w-[45px] h-full relative">
                      <div 
                        ref={secondsScrollRef}
                        onScroll={handleScrollSeconds}
                        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar text-center"
                      >
                        <div className="h-[24px]" />
                        {secondsOptions.map(s => {
                          const isChosen = s === customSeconds;
                          return (
                            <div
                              key={`s-${s}`}
                              onClick={() => {
                                setCustomSeconds(s);
                                const newDuration = customHours * 3600 + customMinutes * 60 + s;
                                setDuration(newDuration);
                              }}
                              className={`h-[32px] w-full flex items-center justify-center snap-center select-none cursor-pointer transition-all ${
                                isChosen 
                                  ? 'text-[18px] text-amber-400 font-black scale-110 leading-none font-mono' 
                                  : 'text-[11px] text-slate-600 hover:text-slate-400 opacity-40 leading-none font-mono'
                              }`}
                            >
                              {String(s).padStart(2, '0')}
                            </div>
                          );
                        })}
                        <div className="h-[24px]" />
                      </div>
                    </div>

                  </div>
                  <span className="text-[10px] text-amber-500/80 font-bold tracking-wider mt-1 select-none">H : M : S</span>
                </div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.span
                  key={isPlaying ? breathPhase : 'manual-adjust'}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none block h-3 mt-1.5 select-none ${!isPlaying ? 'animate-pulse' : ''}`}
                >
                  {isPlaying ? getBreathLabel() : 'Gire para Ajustar'}
                </motion.span>
              </AnimatePresence>

              {breathPhase !== 'still' && isPlaying && (
                <div className="flex gap-1 mt-1.5 justify-center">
                  {[0, 1, 2, 3].map(step => (
                    <span 
                      key={step} 
                      className={`w-1 h-1 rounded-full transition-colors ${
                        (breathTimeline % 4) >= step ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-4 mt-8 relative z-10">
            {/* Reset Button */}
            <button
              id="btn-timer-reset"
              onClick={() => {
                setIsPlaying(false);
                setHasStarted(false);
                setTimeLeft(duration);
              }}
              className="p-3 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Reiniciar tempo"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              id="btn-timer-toggle"
              onClick={() => {
                const nextPlaying = !isPlaying;
                setIsPlaying(nextPlaying);
                if (nextPlaying) {
                  setHasStarted(true);
                }
              }}
              className={`p-5 rounded-2xl flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/20' 
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/20'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 stroke-[3]" />
              ) : (
                <Play className="w-6 h-6 stroke-[3] fill-slate-950 pl-0.5" />
              )}
            </button>

            {/* Silent/Audio Toggle Toggle */}
            <button
              id="btn-timer-mute"
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isMuted ? 'Tirar do mudo' : 'Silenciar áudio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-teal-400" />}
            </button>
          </div>

          {/* Subtitle guidance */}
          <p className="text-[10px] text-slate-500 mt-6 max-w-sm text-center">
            O ciclo compassado simula o Sopro da Vida (4s inspirar, 4s reter, 4s expirar, 4s reter). Concentre-se em Deus e na paz de Cristo.
          </p>
        </div>

        {/* CUSTOMIZER OPTIONS PANEL (Lg spans 5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* CATEGORY / MOMENT TAGS SELECTION */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-500" />
              Momento de Oração / Tags
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              {tagsList.map(t => {
                const isSelected = selectedTag === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTag(t.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{t.emoji}</span>
                      <span>{t.label}</span>
                    </div>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIMER QUICK TEMPLATES PRESETS */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Modelos Rápidos (Templates)
            </h3>
            
            <div className="grid grid-cols-5 gap-1.5">
              {quickDurations.map(num => (
                <button
                  key={num}
                  onClick={() => handlePresetSelect(num)}
                  className="py-3 px-1 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-xs font-bold text-slate-200 text-center cursor-pointer transition-transform duration-200 active:scale-95"
                >
                  {num} min
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-500">
              Escolher um modelo rápido ajustará a roda de tempo automaticamente.
            </p>
          </div>

          {/* Sound & Bells Configuration */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Sino / Alerta de Término
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gong', label: 'Sino de Catedral' },
                { id: 'bell', label: 'Sino Litúrgico' },
                { id: 'bowl', label: 'Harpa de Davi' },
                { id: 'none', label: 'Apenas Silêncio' }
              ].map(sound => (
                <button
                  key={sound.id}
                  id={`btn-sound-${sound.id}`}
                  onClick={() => {
                    setSoundSelection(sound.id as any);
                    if (sound.id !== 'none') {
                      setTimeout(() => playSynthesizedSound(sound.id as any), 100);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-xs text-center font-bold transition-all cursor-pointer ${
                    soundSelection === sound.id 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>

            <button
              id="btn-audiodemo"
              onClick={testAlertSound}
              disabled={soundSelection === 'none' || isMuted}
              className="w-full text-center py-2.5 bg-slate-950 hover:bg-slate-900 rounded-2xl border border-slate-850 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 select-none active:scale-98"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Testar Timbre de Sino
            </button>
          </div>

        </div>
      </div>

      {/* Completion Modal Pop-up with congratulation feedback */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">Prática Concluída!</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Que a paz e a presença de Deus assimiladas nesta oração guiem seus passos ao longo de sua caminhada cristã.
                </p>
              </div>

              {isSoundLooping && (
                <button
                  id="btn-silence-ringing"
                  onClick={stopLoopingSound}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                >
                  <VolumeX className="w-4 h-4" />
                  Silenciar Som (Parar Sino)
                </button>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono space-y-1.5 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recompensas recebidas:</span>
                <span className="text-emerald-400 font-extrabold text-lg flex items-center gap-1">
                  +{Math.round(finishedDuration / 60) * 10} XP
                </span>
                <span className="text-slate-300 text-xs flex items-center gap-1">
                  {tagsList.find(t => t.id === selectedTag)?.emoji}
                  {Math.round(finishedDuration / 60)} min em {tagsList.find(t => t.id === selectedTag)?.label}
                </span>
              </div>

              <button
                id="btn-close-congrats"
                onClick={() => {
                  stopLoopingSound();
                  setShowCompleteModal(false);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors active:scale-97 cursor-pointer"
              >
                Concluir Prática (Vigília Selada)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
