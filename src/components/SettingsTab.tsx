import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Volume2, 
  Bell, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  VolumeX, 
  Info,
  Check,
  ChevronRight,
  Database,
  Trash2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsTabProps {
  onResetApp?: () => void;
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  soundSelection: 'gong',
  alertVolume: 60,
  enableMilestoneAlerts: true,
  enableDailyReminders: true,
  reminderTime: '07:00'
};

export default function SettingsTab({ onResetApp, showToast }: SettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('santuario_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.warn('Error reading settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('santuario_settings', JSON.stringify(settings));
  }, [settings]);

  // Test the selected alert sound with dynamic volume setting
  const testAlertSound = (soundType: 'gong' | 'bell' | 'bowl') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const gainValue = (settings.alertVolume / 100) * 0.4; // normalise volume multiplier

      const playBeep = (freq: number, startDelay: number, duration: number, vol: number, oscType: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, now + startDelay);
        
        gainNode.gain.setValueAtTime(0, now + startDelay);
        gainNode.gain.linearRampToValueAtTime(vol, now + startDelay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
        
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration + 0.05);
      };

      if (soundType === 'gong') {
        playBeep(220, 0.0, 0.4, gainValue); 
        playBeep(220, 0.15, 0.4, gainValue);
        playBeep(220, 0.30, 0.7, gainValue * 1.1);
      } else if (soundType === 'bell') {
        playBeep(523.25, 0.0, 0.15, gainValue * 0.85); 
        playBeep(587.33, 0.1, 0.15, gainValue * 0.85); 
        playBeep(659.25, 0.25, 0.2, gainValue * 0.85); 
        playBeep(783.99, 0.35, 0.4, gainValue * 0.85); 
      } else if (soundType === 'bowl') {
        playBeep(440.00, 0.0, 0.12, gainValue * 0.8, 'triangle');
        playBeep(440.00, 0.1, 0.12, gainValue * 0.8, 'triangle');
        playBeep(440.00, 0.2, 0.12, gainValue * 0.8, 'triangle');
        playBeep(554.37, 0.35, 0.5, gainValue * 0.95, 'sine');
      }
    } catch (e) {
      console.log('Audio Context error during test:', e);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetData = () => {
    if (onResetApp) {
      onResetApp();
      showToast("Todos os dados foram resetados para os padrões originais com sucesso!", "success");
      setConfirmReset(false);
    } else {
      localStorage.clear();
      showToast("Dados locais limpos! Recarregue a página.", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-3xl mx-auto space-y-6 pb-12"
    >
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Sliders className="text-amber-500 w-6 h-6" />
          Ajustes e Preferências
        </h2>
        <p className="text-slate-400 text-sm">
          Personalize sons do cronômetro, volumes dos alarmes e alertas de marcos espirituais para sua jornada espiritual.
        </p>
      </div>

      {/* Main Form Settings */}
      <div className="space-y-6">
        
        {/* Som e Alertas Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
          <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="text-amber-500 w-5 h-5" />
            Alertas Sonoros
          </h3>

          {/* Sound selection grids */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
              Som da Sinalização e Finalização
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['gong', 'bell', 'bowl', 'none'] as const).map(sound => (
                <button
                  key={sound}
                  onClick={() => {
                    updateSetting('soundSelection', sound);
                    if (sound !== 'none') {
                      testAlertSound(sound);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer capitalize ${
                    settings.soundSelection === sound
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-250'
                  }`}
                >
                  <span className="text-lg">
                    {sound === 'gong' ? '🔔' : sound === 'bell' ? '🎵' : sound === 'bowl' ? '🥣' : '🔇'}
                  </span>
                  <span>{sound === 'none' ? 'Silencioso' : sound}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          {settings.soundSelection !== 'none' && (
            <div className="space-y-2.5 pt-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-500" /> Volume do Alerta
                </span>
                <span className="font-mono text-amber-500 font-bold">{settings.alertVolume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.alertVolume}
                  onChange={(e) => updateSetting('alertVolume', parseInt(e.target.value, 10))}
                  className="flex-1 accent-amber-500 bg-slate-950 h-2.5 rounded-full cursor-pointer appearance-none border border-slate-850"
                />
                <Volume2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (settings.soundSelection !== 'none') {
                      testAlertSound(settings.soundSelection);
                    }
                  }}
                  className="px-3 py-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] uppercase font-black text-slate-350 hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  Testar Som de Alerta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notificações e Horários Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
          <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="text-amber-500 w-5 h-5" />
            Vigília e Produtividade
          </h3>

          {/* Toggle milestone beeps */}
          <div className="flex justify-between items-center gap-4 py-1">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block">
                Sinais de 10 Minutos
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block leading-normal">
                Emitir sinal sonoro discreto e vibrar a cada 10 minutos de contagem progressiva ativa no cronômetro.
              </span>
            </div>
            <button
              onClick={() => updateSetting('enableMilestoneAlerts', !settings.enableMilestoneAlerts)}
              className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer flex items-center shrink-0 ${
                settings.enableMilestoneAlerts ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4.5 h-4.5 bg-slate-950 rounded-full shadow-md" />
            </button>
          </div>

          {/* Daily reminder toggle */}
          <div className="flex justify-between items-center gap-4 py-1 border-t border-slate-850/50 pt-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block">
                Lembretes Diários
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block leading-normal">
                Notificar no horário estipulado para manter sua prática de meditação e preces diárias.
              </span>
            </div>
            <button
              onClick={() => updateSetting('enableDailyReminders', !settings.enableDailyReminders)}
              className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer flex items-center shrink-0 ${
                settings.enableDailyReminders ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4.5 h-4.5 bg-slate-950 rounded-full shadow-md" />
            </button>
          </div>

          {settings.enableDailyReminders && (
            <div className="pt-2 pl-2 border-l-2 border-amber-500/20 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Horário Recomendado do Devocional
              </label>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => updateSetting('reminderTime', e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-sm font-semibold font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}
        </div>

        {/* Futuras Preferências Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-md font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="text-amber-500 w-5 h-5" />
            Preferências do Santuário
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Tema Espiritual</span>
                <select 
                  disabled
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold"
                >
                  <option>Catedral Clássica (Padrão)</option>
                  <option>Monte Hermon (Em breve)</option>
                  <option>Ermida Silenciosa (Em breve)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Metas Semanais de Oração</span>
                <select 
                  disabled
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold"
                >
                  <option>Modo Livre (Padrão)</option>
                  <option>30 Minutos Semanais</option>
                  <option>60 Minutos Semanais</option>
                  <option>120 Minutos Semanais</option>
                </select>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal bg-slate-950/45 p-3 rounded-xl border border-slate-850/30 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-500/60 shrink-0 mt-0.5" />
              <span>
                Personalizações adicionais de metas de orações e visuais de templo estão sob desenvolvimento e serão integradas com armazenamento local persistente.
              </span>
            </p>
          </div>
        </div>

        {/* Gerenciamento de Armazenamento e Limpeza */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-md font-bold text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trash2 className="text-rose-500 w-5 h-5" />
            Zona de Segurança
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            <div className="max-w-md">
              <span className="text-xs uppercase font-extrabold tracking-wider text-rose-300 block">
                Resetar Templo Local
              </span>
              <span className="text-slate-500 text-xs mt-0.5 block leading-normal">
                Apagar permanentemente todos os seus hábitos personalizados, conquistas, histórico de preces e notas do diário. Esta operação é irreversível.
              </span>
            </div>
            
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 text-center"
              >
                Resetar Dados
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-850 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
