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
  Compass
} from 'lucide-react';
import { TimerPreset } from '../types';
import { TIMER_PRESETS } from '../data/defaultData';

interface TimerTabProps {
  key?: string;
  onCompleteMeditation: (seconds: number) => void;
  userIdName?: string;
}

export default function TimerTab({ onCompleteMeditation, userIdName }: TimerTabProps) {
  // Configurable states
  const [duration, setDuration] = useState<number>(600); // 10 minutes default (600s)
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [soundSelection, setSoundSelection] = useState<'gong' | 'bell' | 'bowl' | 'none'>('gong');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Guided breathing states
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'still'>('still');
  const [breathTimeline, setBreathTimeline] = useState<number>(0); // 0-16 cycle

  // Completion modal / feedback overlay state
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [finishedDuration, setFinishedDuration] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const breathIntervalRef = useRef<number | null>(null);

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
    };
  }, []);

  // Sync remaining seconds with duration if not running
  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(duration);
    }
  }, [duration, isPlaying]);

  // Audio synthesis engine using standard AudioContext
  // Plays satisfying bell/gong frequencies without needing external loaded assets
  const playSynthesizedSound = (type: 'gong' | 'bell' | 'bowl') => {
    if (isMuted) return;

    try {
      // Create or resume contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'gong') {
        // Grand deep cosmic frequencies
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now); // Low fundamental
        osc.frequency.exponentialRampToValueAtTime(108, now + 5);

        // Add overtone for richness
        const over = ctx.createOscillator();
        const overGain = ctx.createGain();
        over.type = 'triangle';
        over.frequency.setValueAtTime(216, now);
        over.connect(overGain);
        overGain.connect(ctx.destination);
        
        overGain.gain.setValueAtTime(0.08, now);
        overGain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
        over.start(now);
        over.stop(now + 4);

        // Main gain curve
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
        osc.start(now);
        osc.stop(now + 6);
      } else if (type === 'bell') {
        // High resonance spiritual brass bell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(330, now + 3);

        const bellOver = ctx.createOscillator();
        const bellOverGain = ctx.createGain();
        bellOver.type = 'sine';
        bellOver.frequency.setValueAtTime(880, now); // A5 overtone
        bellOver.connect(bellOverGain);
        bellOverGain.connect(ctx.destination);

        bellOverGain.gain.setValueAtTime(0.12, now);
        bellOverGain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
        bellOver.start(now);
        bellOver.stop(now + 2.5);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
        osc.start(now);
        osc.stop(now + 4);
      } else if (type === 'bowl') {
        // Tibetan singing bowl, warm and full
        osc.type = 'sine';
        osc.frequency.setValueAtTime(288, now); // F4 approx warm tone
        
        // Tremolo / frequency modulation to simulate vibration
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(6, now); // 6Hz vibration
        lfoGain.gain.setValueAtTime(2, now); // pitch width
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        lfo.start(now);
        lfo.stop(now + 5);

        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 5);
        
        osc.start(now);
        osc.stop(now + 5);
      }
    } catch (e) {
      console.log('Audio synthesis is muted or not permitted by browser sandbox.', e);
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

  // Main countdown scheduler
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Done!
            setIsPlaying(false);
            setFinishedDuration(duration);
            setShowCompleteModal(true);
            onCompleteMeditation(duration);
            
            // Loop sound alert continuously until explicitly canceled
            if (soundSelection !== 'none') {
              setIsSoundLooping(true);
              playSynthesizedSound(soundSelection);
              if (soundIntervalRef.current) window.clearInterval(soundIntervalRef.current);
              soundIntervalRef.current = window.setInterval(() => {
                playSynthesizedSound(soundSelection);
              }, 4000);
            }
            
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, duration, soundSelection, onCompleteMeditation]);

  // Handle setting preset values
  const handlePresetSelect = (durationSecs: number) => {
    setIsPlaying(false);
    setDuration(durationSecs);
    setTimeLeft(durationSecs);
  };

  // Convert custom minutes text field input
  const handleCustomInputSubmit = (minutes: number) => {
    const val = Math.min(Math.max(minutes, 1), 180);
    setCustomMinutes(val);
    setDuration(val * 60);
    setTimeLeft(val * 60);
  };

  // Play test gongs
  const testAlertSound = () => {
    playSynthesizedSound(soundSelection);
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress circle SVG calculation
  const progressRatio = duration > 0 ? (timeLeft / duration) : 0;
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - progressRatio); // circle radius is 90

  // Breath phrase text labels
  const getBreathLabel = () => {
    if (breathPhase === 'inhale') return 'Inale lentamente...';
    if (breathPhase === 'hold') return 'Retenha o ar...';
    if (breathPhase === 'exhale') return 'Exale suavemente...';
    return 'Presença Plena';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100 flex items-center gap-2">
          <Clock className="text-amber-500 w-6 h-6" />
          Vigília e Oração de Silêncio
        </h2>
        <p className="text-slate-400 text-sm">
          Ajuste as predefinições da sua oração de quietude ou leitura, configure o tempo personalizado e fique em presença silenciosa de adoração.
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
          <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* SVG circle stroke */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Slate Outer ring */}
              <circle
                cx="128"
                cy="128"
                r="90"
                className="stroke-slate-950 fill-transparent stroke-[6]"
              />
              {/* Inner highlight representing remaining progress */}
              <motion.circle
                cx="128"
                cy="128"
                r="90"
                className="stroke-amber-400 fill-transparent stroke-[6] stroke-linecap-round"
                strokeDasharray={2 * Math.PI * 90}
                animate={{ strokeDashoffset }}
                transition={{ duration: isPlaying ? 1 : 0.3 }}
              />
            </svg>

            {/* Central Breath Sphere */}
            <motion.div
              animate={{
                scale: breathPhase === 'inhale' ? 1.15 : breathPhase === 'exhale' ? 0.85 : breathPhase === 'hold' ? 1.25 : 1,
                borderColor: breathPhase === 'hold' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.3)'
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute w-44 h-44 rounded-full bg-slate-950 border-2 flex flex-col items-center justify-center text-center p-3 shadow-2xl"
            >
              <span className="text-3xl font-bold font-mono tracking-wider text-slate-100 mb-1">
                {formatTime(timeLeft)}
              </span>
              
              <AnimatePresence mode="wait">
                <motion.span
                  key={breathPhase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-amber-500 font-semibold uppercase tracking-widest leading-none block h-4 mt-1"
                >
                  {getBreathLabel()}
                </motion.span>
              </AnimatePresence>

              {breathPhase !== 'still' && (
                <div className="flex gap-1.5 mt-2 justify-center">
                  {[0, 1, 2, 3].map(step => (
                    <span 
                      key={step} 
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
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
              onClick={() => setIsPlaying(!isPlaying)}
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
          
          {/* Standard Presets Block */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500" />
              Presets Manhã & Noite
            </h3>
            
            <div className="space-y-2">
              {/* Presets Map */}
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`btn-preset-${preset.id}`}
                  onClick={() => handlePresetSelect(preset.durationSeconds)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                    duration === preset.durationSeconds 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold' 
                      : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${preset.timeOfDay === 'morning' ? 'bg-amber-400/10 text-amber-400' : 'bg-indigo-400/10 text-indigo-400'}`}>
                      {preset.timeOfDay === 'morning' ? (
                        <Sun className="w-3.5 h-3.5" />
                      ) : (
                        <Moon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs block leading-none">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Preset consagrado de oração</span>
                    </div>
                  </div>
                  
                  <span className="text-xs font-mono font-medium">
                    {preset.durationSeconds / 60}m
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Minute Adjuster */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Tempo Customizado
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
                <input
                  id="input-custom-minutes"
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={e => handleCustomInputSubmit(Number(e.target.value))}
                  className="bg-transparent border-none text-slate-100 text-lg font-bold font-mono pl-3 focus:outline-none w-24"
                />
                <span className="text-xs text-slate-400">Minutos (Prática personalizada)</span>
              </div>

              {/* Quick adjustment sliders */}
              <input
                id="slider-timer"
                type="range"
                min="1"
                max="90"
                value={customMinutes}
                onChange={e => handleCustomInputSubmit(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 min</span>
                <span>45 min</span>
                <span>90 min</span>
              </div>
            </div>
          </div>

          {/* Sound & Bells Configuration */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
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
                    // play sound previews
                    if (sound.id !== 'none') {
                      setTimeout(() => playSynthesizedSound(sound.id as any), 100);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-center font-medium transition-all ${
                    soundSelection === sound.id 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold' 
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
              className="w-full text-center py-2 bg-slate-950 hover:bg-slate-900 rounded-xl border border-slate-850 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 select-none active:scale-98"
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
                <span className="text-slate-300 text-xs">
                  {Math.round(finishedDuration / 60)} min em oração ativa
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
