import { Habit, Trophy, TimerPreset } from '../types';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'hb-morning-med',
    name: 'Oração Contemplativa',
    description: 'Começar o dia na presença de Deus, buscando paz, silêncio e reflexão devocional.',
    category: 'meditation',
    schedule: 'morning',
    streak: 0,
    maxStreak: 0,
    history: [],
    createdAt: '2026-05-01'
  },
  {
    id: 'hb-prayer',
    name: 'Oração e Clamor Coletivo',
    description: 'Momento de clamor e intercessão a Deus por nossa família, amigos e gratidão pelas bênçãos.',
    category: 'spiritual',
    schedule: 'anytime',
    streak: 0,
    maxStreak: 0,
    history: [],
    createdAt: '2026-05-01'
  },
  {
    id: 'hb-spiritual-reading',
    name: 'Leitura Bíblica',
    description: 'Leitura diária das Escrituras Sagradas, Salmos e livros teológicos que fortalecem a fé.',
    category: 'reading',
    schedule: 'anytime',
    streak: 0,
    maxStreak: 0,
    history: [],
    createdAt: '2026-05-01'
  },
  {
    id: 'hb-gratitude',
    name: 'Agradecimento Cristão',
    description: 'Praticar o contentamento anotando 3 coisas pelas quais sou profundamente grato a Deus hoje.',
    category: 'gratitude',
    schedule: 'evening',
    streak: 0,
    maxStreak: 0,
    history: [],
    createdAt: '2026-05-01'
  },
  {
    id: 'hb-reflection',
    name: 'Exame de Consciência',
    description: 'Reflexão sincera sobre as ações do dia antes de deitar, pedindo perdão e direcionamento divino.',
    category: 'reflection',
    schedule: 'evening',
    streak: 0,
    maxStreak: 0,
    history: [],
    createdAt: '2026-05-01'
  }
];

export const TROPHIES: Trophy[] = [
  {
    id: 'tr-streak-1',
    title: 'Primeira Centelha 🌟',
    description: 'Seu primeiro dia de consagração e hábitos espirituais concluídos com sucesso no app.',
    iconName: 'Sparkles',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 1,
    emoji: '🌱 01'
  },
  {
    id: 'tr-streak-3',
    title: 'Fidelidade Temporal 🕯️',
    description: 'Alcançou 3 dias seguidos de compromisso vigilante com Deus e hábitos consagrados.',
    iconName: 'Flame',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 3,
    emoji: '🕯️ 03'
  },
  {
    id: 'tr-week-devotion',
    title: 'Altar da Semana ⛪',
    description: '7 dias ininterruptos de orações e hábitos diários, edificando o templo de seu coração.',
    iconName: 'Milestone',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 7,
    emoji: '⛪ 07'
  },
  {
    id: 'tr-streak-10',
    title: 'Sentinela da Oração 🛡️',
    description: 'Dedicou-se firmemente com persistência durante 10 dias seguidos de hábitos ativos.',
    iconName: 'Heart',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 10,
    emoji: '🛡️ 10'
  },
  {
    id: 'tr-streak-15',
    title: 'Fortaleza Inabalável 🏰',
    description: 'Passou pela prova do tempo! Completou 15 dias de sequência de fidelidade ininterrupta.',
    iconName: 'Award',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 15,
    emoji: '🏰 15'
  },
  {
    id: 'tr-constant-flow',
    title: 'Rio de Água Viva 🌊',
    description: 'Obteve 30 dias contínuos em plena comunhão espiritual de hábitos de graça e santidade.',
    iconName: 'Compass',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 30,
    emoji: '🌊 30'
  },
  {
    id: 'tr-streak-70',
    title: 'Coroa da Perseverança (10 Semanas) 👑',
    description: 'Vencedor espiritual! Alcançou incríveis 10 semanas (70 dias) seguidos de fidelidade diária.',
    iconName: 'Award',
    group: 'streak',
    requirementType: 'streak_days',
    requirementValue: 70,
    emoji: '👑 70'
  },
  {
    id: 'tr-first-step',
    title: 'Primeiro Alento',
    description: 'Dê o primeiro passo completando seu primeiro hábito espiritual registrado.',
    iconName: 'Sparkles',
    group: 'habit',
    requirementType: 'total_habits',
    requirementValue: 1,
    emoji: '✨ 01'
  },
  {
    id: 'tr-level-seeker',
    title: 'Discípulo Zeloso',
    description: 'Evolua sua fé e atinja com maestria o Nível 3 em sua caminhada espiritual.',
    iconName: 'Award',
    group: 'level',
    requirementType: 'reached_level',
    requirementValue: 3,
    emoji: '🕊️ L3'
  },
  {
    id: 'tr-hour-of-silence',
    title: 'Guardião do Silêncio',
    description: 'Acumule 60 minutos (1 hora) de clamor ou tempo de silêncio no foco espiritual.',
    iconName: 'Clock',
    group: 'meditation',
    requirementType: 'meditation_minutes',
    requirementValue: 60,
    emoji: '⏱️ 60'
  }
];

export const TIMER_PRESETS: TimerPreset[] = [
  {
    id: 'tp-m-5',
    label: 'Devocional Rápido (Manhã)',
    durationSeconds: 300,
    timeOfDay: 'morning'
  },
  {
    id: 'tp-m-15',
    label: 'Vigília e Clamor (Manhã)',
    durationSeconds: 900,
    timeOfDay: 'morning'
  },
  {
    id: 'tp-e-10',
    label: 'Aquietamento da Mente (Noite)',
    durationSeconds: 600,
    timeOfDay: 'evening'
  },
  {
    id: 'tp-e-20',
    label: 'Oração de Quietude (Noite)',
    durationSeconds: 1200,
    timeOfDay: 'evening'
  }
];

export interface LevelThreshold {
  level: number;
  xpNeeded: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpNeeded: 0, title: 'Servo Iniciante' },
  { level: 2, xpNeeded: 150, title: 'Discípulo da Fé' },
  { level: 3, xpNeeded: 400, title: 'Sentinela da Oração' },
  { level: 4, xpNeeded: 800, title: 'Soldado de Cristo' },
  { level: 5, xpNeeded: 1400, title: 'Guardião da Retidão' },
  { level: 6, xpNeeded: 2200, title: 'Devoto Fiel' },
  { level: 7, xpNeeded: 3200, title: 'Coluna da Igreja' },
  { level: 8, xpNeeded: 4500, title: 'Exemplo de Piedade' },
  { level: 9, xpNeeded: 6000, title: 'Farol do Evangelho' },
  { level: 10, xpNeeded: 8000, title: 'Testemunha da Luz' }
];

export function getLevelTitle(level: number): string {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return threshold ? threshold.title : 'Discípulo Espiritual';
}

export function getXPForNextLevel(level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === level);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === level + 1);
  if (!nextThreshold) return 999999; // Max level reached
  
  if (currentThreshold) {
    return nextThreshold.xpNeeded - currentThreshold.xpNeeded;
  }
  return 1000;
}

export function getAccumulatedXPForLevel(level: number): number {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level);
  return threshold ? threshold.xpNeeded : 0;
}
