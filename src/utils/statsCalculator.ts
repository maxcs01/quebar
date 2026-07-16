import { DayProgress, Habit, UserProfile } from '../types';

// Safe date converters
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Get array of YYYY-MM-DD date strings for the past N days
export function getPastDates(days: number): string[] {
  const list: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    list.push(formatDate(d));
  }
  return list;
}

// Fit daily values between a start and end date
export function getDatesBetween(startStr: string, endStr: string): string[] {
  const list: string[] = [];
  let current = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  
  // Guard against reverse dates
  if (current.getTime() > end.getTime()) {
    return [startStr];
  }

  // Cap at 365 days to avoid browser locks
  let count = 0;
  while (current.getTime() <= end.getTime() && count < 365) {
    list.push(formatDate(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return list;
}

export type TimeframeOption = 'hoje' | '7d' | '15d' | '30d' | '90d' | '6m' | '1y' | 'custom';

export interface FilteredStatsContext {
  days: string[];
  historyFiltered: DayProgress[];
  totalPrayerMinutes: number;
  totalReadingMinutes: number;
  totalCompletions: number;
  totalPeoplePrayed: number;
}

// Main Filter Function
export function getFilteredContext(
  history: DayProgress[],
  habits: Habit[],
  timeframe: TimeframeOption,
  customStart?: string,
  customEnd?: string
): FilteredStatsContext {
  let dates: string[] = [];
  const todayStr = formatDate(new Date());

  if (timeframe === 'hoje') {
    dates = [todayStr];
  } else if (timeframe === '7d') {
    dates = getPastDates(7);
  } else if (timeframe === '15d') {
    dates = getPastDates(15);
  } else if (timeframe === '30d') {
    dates = getPastDates(30);
  } else if (timeframe === '90d') {
    dates = getPastDates(90);
  } else if (timeframe === '6m') {
    dates = getPastDates(180);
  } else if (timeframe === '1y') {
    dates = getPastDates(365);
  } else if (timeframe === 'custom' && customStart && customEnd) {
    dates = getDatesBetween(customStart, customEnd);
  } else {
    dates = getPastDates(7); // default fallback
  }

  const dateSet = new Set(dates);
  const historyFiltered = history.filter(h => dateSet.has(h.date));

  // Dynamic calculations
  let prayerSecs = 0;
  let readingSecs = 0;
  let habitCompletions = 0;

  historyFiltered.forEach(day => {
    // Habits completions
    habitCompletions += day.habitsCompleted?.length || 0;

    // Sessions metrics
    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        if (s.tag === 'leitura') {
          readingSecs += s.durationSeconds;
        } else {
          prayerSecs += s.durationSeconds;
        }
      });
    } else {
      // Fallback for flat meditationSeconds
      prayerSecs += day.meditationSeconds || 0;
    }
  });

  // Check how many people prayed for
  // Let's load the active list of prayer requests to get an accurate number
  let prayerRequestsCount = 0;
  try {
    const stored = localStorage.getItem('santuario_pedidos');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        prayerRequestsCount = parsed.length;
      }
    }
  } catch (e) {}

  return {
    days: dates,
    historyFiltered,
    totalPrayerMinutes: Math.round(prayerSecs / 60),
    totalReadingMinutes: Math.round(readingSecs / 60),
    totalCompletions: habitCompletions,
    totalPeoplePrayed: prayerRequestsCount
  };
}

// Mathematical Linear Regression for Trendlines: y = m * x + b
export interface Point {
  x: number;
  y: number;
}

export function calculateTrendline(points: Point[]): Point[] {
  const n = points.length;
  if (n <= 1) return points;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
    sumXY += points[i].x * points[i].y;
    sumXX += points[i].x * points[i].x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    const avgY = sumY / n;
    return [
      { x: points[0].x, y: avgY },
      { x: points[n - 1].x, y: avgY }
    ];
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return [
    { x: points[0].x, y: slope * points[0].x + intercept },
    { x: points[n - 1].x, y: slope * points[n - 1].x + intercept }
  ];
}

// Simple Moving Average (3 Days)
export function calculateMovingAverage(values: number[], period: number = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - period + 1); j <= i; j++) {
      sum += values[j];
      count++;
    }
    result.push(count > 0 ? Math.round(sum / count) : 0);
  }
  return result;
}

// Weekly Prayer Radar data calculation
export interface RadarDayData {
  dayName: string;
  minutes: number;
}

export function getWeeklyPrayerRadar(historyFiltered: DayProgress[]): RadarDayData[] {
  const dayOfWeekSum = [0, 0, 0, 0, 0, 0, 0]; // 0: Sun, 1: Mon...
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  historyFiltered.forEach(day => {
    const dw = parseLocalDate(day.date).getDay();
    let prayerSecs = 0;
    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        if (s.tag !== 'leitura') prayerSecs += s.durationSeconds;
      });
    } else {
      prayerSecs += day.meditationSeconds || 0;
    }
    dayOfWeekSum[dw] += Math.round(prayerSecs / 60);
  });

  return dayOfWeekSum.map((minutes, index) => ({
    dayName: dayNames[index],
    minutes
  }));
}

// General Hexagonal Radar metrics (0 to 100)
export interface GeneralRadarMetrics {
  label: string;
  score: number;
}

export function getGeneralRadar(
  historyFiltered: DayProgress[],
  habitsCount: number,
  streak: number
): GeneralRadarMetrics[] {
  // 1. Oração: total minutes scaled (cap at 600 min)
  let prayerSecs = 0;
  let readingSecs = 0;
  let habitsCompleted = 0;
  let activeDays = 0;

  historyFiltered.forEach(day => {
    let active = false;
    if (day.habitsCompleted && day.habitsCompleted.length > 0) {
      habitsCompleted += day.habitsCompleted.length;
      active = true;
    }

    let pSecs = 0;
    let rSecs = 0;
    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        if (s.tag === 'leitura') rSecs += s.durationSeconds;
        else pSecs += s.durationSeconds;
      });
    } else {
      pSecs += day.meditationSeconds || 0;
    }

    prayerSecs += pSecs;
    readingSecs += rSecs;

    if (pSecs > 0 || rSecs > 0) active = true;
    if (active) activeDays++;
  });

  const totalFilteredDays = historyFiltered.length || 7;

  // Let's evaluate scores out of 100
  const prayerScore = Math.min(Math.round((prayerSecs / 60 / (totalFilteredDays * 20)) * 100), 100); // 20 min/day target
  const readingScore = Math.min(Math.round((readingSecs / 60 / (totalFilteredDays * 15)) * 100), 100); // 15 min/day target
  
  const possibleCompletions = totalFilteredDays * habitsCount;
  const habitsScore = possibleCompletions > 0 
    ? Math.min(Math.round((habitsCompleted / possibleCompletions) * 100), 100)
    : 0;

  const constancyScore = Math.min(Math.round((activeDays / totalFilteredDays) * 100), 100);
  
  // Intercessão (based on prayer requests list count, cap at 10)
  let prayerRequestsCount = 0;
  try {
    const stored = localStorage.getItem('santuario_pedidos');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) prayerRequestsCount = parsed.length;
    }
  } catch (e) {}
  const intercessionScore = Math.min(prayerRequestsCount * 10, 100);

  // Disciplina (active morning and evening completions)
  const disciplineScore = Math.min(Math.round((streak / 7) * 40) + 40, 100);

  return [
    { label: 'Oração', score: Math.max(prayerScore, 10) },
    { label: 'Leitura', score: Math.max(readingScore, 10) },
    { label: 'Hábitos', score: Math.max(habitsScore, 10) },
    { label: 'Constância', score: Math.max(constancyScore, 10) },
    { label: 'Intercessão', score: Math.max(intercessionScore, 10) },
    { label: 'Disciplina', score: Math.max(disciplineScore, 10) }
  ];
}

// 15 Specific Spiritual Indicators
export interface KPIIndicator {
  label: string;
  value: string | number;
  description: string;
}

export function calculateInterestingStats(
  history: DayProgress[],
  habits: Habit[],
  profile: UserProfile
): KPIIndicator[] {
  let totalPrayerSecs = 0;
  let totalReadingSecs = 0;
  let totalCompletions = 0;
  let activeDays = 0;
  let prayerSessionsCount = 0;
  let readingSessionsCount = 0;

  const dateSet = new Set<string>();

  history.forEach(day => {
    let dayHasActivity = false;
    dateSet.add(day.date);

    if (day.habitsCompleted && day.habitsCompleted.length > 0) {
      totalCompletions += day.habitsCompleted.length;
      dayHasActivity = true;
    }

    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        dayHasActivity = true;
        if (s.tag === 'leitura') {
          totalReadingSecs += s.durationSeconds;
          readingSessionsCount++;
        } else {
          totalPrayerSecs += s.durationSeconds;
          prayerSessionsCount++;
        }
      });
    } else if (day.meditationSeconds > 0) {
      dayHasActivity = true;
      totalPrayerSecs += day.meditationSeconds;
      prayerSessionsCount++;
    }

    if (dayHasActivity) activeDays++;
  });

  const totalDaysLog = history.length || 1;
  const avgPrayerMin = Math.round((totalPrayerSecs / 60) / totalDaysLog);
  const avgReadingMin = Math.round((totalReadingSecs / 60) / totalDaysLog);

  // Prayer requests count
  let prayerRequestsCount = 0;
  try {
    const stored = localStorage.getItem('santuario_pedidos');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) prayerRequestsCount = parsed.length;
    }
  } catch (e) {}

  // Age of the altar (days since first log)
  let altarAge = 1;
  if (history.length > 0) {
    const sortedDates = [...history].map(h => h.date).sort();
    const firstDate = parseLocalDate(sortedDates[0]);
    const diff = Date.now() - firstDate.getTime();
    altarAge = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Habits completion rate
  const possibleCompletions = history.length * habits.length;
  const habitsCompletionRate = possibleCompletions > 0 
    ? Math.round((totalCompletions / possibleCompletions) * 100)
    : 0;

  // Month-on-month growth comparison
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let currentMonthMins = 0;
  let prevMonthMins = 0;

  history.forEach(day => {
    const d = parseLocalDate(day.date);
    let dayMins = 0;
    if (day.sessions && day.sessions.length > 0) {
      dayMins = Math.round(day.sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);
    } else {
      dayMins = Math.round((day.meditationSeconds || 0) / 60);
    }

    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      currentMonthMins += dayMins;
    } else if (
      (currentMonth === 0 && d.getFullYear() === currentYear - 1 && d.getMonth() === 11) ||
      (currentMonth > 0 && d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1)
    ) {
      prevMonthMins += dayMins;
    }
  });

  let monthlyGrowthStr = '0%';
  if (prevMonthMins > 0) {
    const ratio = (currentMonthMins - prevMonthMins) / prevMonthMins;
    const sign = ratio >= 0 ? '+' : '';
    monthlyGrowthStr = `${sign}${Math.round(ratio * 100)}%`;
  } else if (currentMonthMins > 0) {
    monthlyGrowthStr = '+100%';
  }

  return [
    { label: 'Sequência Atual', value: `${profile.streak} dias`, description: 'Dias seguidos no app' },
    { label: 'Melhor Sequência', value: `${profile.maxStreak} dias`, description: 'Recorde absoluto de constância' },
    { label: 'Média Diária de Oração', value: `${avgPrayerMin} min`, description: 'Média de todos os registros' },
    { label: 'Média Diária de Leitura', value: `${avgReadingMin} min`, description: 'Média de estudo das escrituras' },
    { label: 'Pessoas Intercedidas', value: `${prayerRequestsCount} pessoas`, description: 'Fila ativa de pedidos de oração' },
    { label: 'Dias Totais Ativos', value: `${activeDays} dias`, description: 'Dias com práticas espirituais' },
    { label: 'Crescimento Mensal', value: monthlyGrowthStr, description: 'Evolução de minutos contra mês anterior' },
    { label: 'Taxa de Hábitos', value: `${habitsCompletionRate}%`, description: 'Porcentagem de tarefas completadas' },
    { label: 'Experiência Acumulada', value: `${profile.xp} XP`, description: 'Sua pontuação no altar do templo' },
    { label: 'Nível Devocional', value: `Nível ${profile.level}`, description: 'Sua escala de maturidade espiritual' },
    { label: 'Idade do Altar', value: `${altarAge} dias`, description: 'Tempo desde seu primeiro registro' },
    { label: 'Tempo Total de Oração', value: `${Math.round(totalPrayerSecs / 3600)} horas`, description: 'Horas investidas em conversa espiritual' },
    { label: 'Tempo Total de Leitura', value: `${Math.round(totalReadingSecs / 3600)} horas`, description: 'Horas lendo as Escrituras' },
    { label: 'Sessões de Oração', value: `${prayerSessionsCount} sessões`, description: 'Períodos separados de comunhão' },
    { label: 'Sessões de Leitura', value: `${readingSessionsCount} sessões`, description: 'Períodos de estudo das Escrituras' }
  ];
}

// Chronological Milestones
export interface MilestoneEntry {
  title: string;
  description: string;
  dateStr: string;
  type: 'start' | 'prayer_record' | 'streak_record' | 'perfect_day' | 'levelup' | 'reading_record';
  emoji: string;
}

export function calculateMilestones(
  history: DayProgress[],
  habits: Habit[],
  profile: UserProfile
): MilestoneEntry[] {
  const milestones: MilestoneEntry[] = [];
  if (history.length === 0) return [];

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 1. 🌱 Start milestone
  milestones.push({
    title: 'Início da Jornada Espiritual',
    description: 'Você ergueu seu altar sagrado e registrou sua primeira vigília de comunhão no aplicativo.',
    dateStr: sortedHistory[0].date,
    type: 'start',
    emoji: '🌱'
  });

  // Track max records
  let maxPrayerSecs = 0;
  let maxReadingSecs = 0;
  let maxStreakDay = 0;

  sortedHistory.forEach(day => {
    // Perfect day check
    const totalPossible = habits.length || 5;
    const completed = day.habitsCompleted?.length || 0;
    if (completed === totalPossible) {
      // Avoid duplicated spam of perfect days by pushing only one unique perfect day statement
      if (!milestones.some(m => m.type === 'perfect_day')) {
        milestones.push({
          title: 'Primeiro Dia Perfeito! 🌟',
          description: 'Você cumpriu 100% de seus propósitos e disciplinas devocionais nas 24 horas.',
          dateStr: day.date,
          type: 'perfect_day',
          emoji: '⭐'
        });
      }
    }

    // Sessions metrics
    let pSecs = 0;
    let rSecs = 0;
    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        if (s.tag === 'leitura') rSecs += s.durationSeconds;
        else pSecs += s.durationSeconds;
      });
    } else {
      pSecs += day.meditationSeconds || 0;
    }

    // 30+ min single prayer session record
    if (pSecs >= 1800 && maxPrayerSecs < 1800) {
      maxPrayerSecs = pSecs;
      milestones.push({
        title: 'Sentinela da Presença 🔥',
        description: `Completou sua primeira sessão intensa de mais de 30 minutos (${Math.round(pSecs / 60)} min) em comunhão silenciosa.`,
        dateStr: day.date,
        type: 'prayer_record',
        emoji: '🛡️'
      });
    }

    // 20+ min reading record
    if (rSecs >= 1200 && maxReadingSecs < 1200) {
      maxReadingSecs = rSecs;
      milestones.push({
        title: 'Estudioso das Escrituras 📖',
        description: `Dedicou um estudo ininterrupto aprofundado da Bíblia de mais de 20 minutos (${Math.round(rSecs / 60)} min) hoje.`,
        dateStr: day.date,
        type: 'reading_record',
        emoji: '📚'
      });
    }
  });

  // Level milestones
  if (profile.level > 1) {
    milestones.push({
      title: 'Ascensão ao Nível Superior 👑',
      description: `Sua alma atingiu o prestigioso Nível ${profile.level}. Sua disciplina no altar edifica todos os anais.`,
      dateStr: formatDate(new Date()),
      type: 'levelup',
      emoji: '🏅'
    });
  }

  // Max streak
  if (profile.maxStreak >= 7) {
    milestones.push({
      title: 'Chama Inabalável 🕯️',
      description: `Alcançou uma ofensiva memorável de ${profile.maxStreak} dias consecutivos de total fidelidade temporal.`,
      dateStr: formatDate(new Date()),
      type: 'streak_record',
      emoji: '🔥'
    });
  }

  // Sort milestones so newest are displayed first
  return milestones.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
}

// Algorithmic Smart Insights
export function generateSmartInsights(
  history: DayProgress[],
  totalPrayerMin: number,
  totalReadingMin: number,
  streak: number,
  habits: Habit[]
): string[] {
  const insights: string[] = [];

  // 1. Initial greeting insight
  if (history.length === 0) {
    return [
      '🌱 Altar Iniciado: Registre seu primeiro hábito ou comece um cronômetro de vigília na tela inicial para gerar insights de fé.',
      '📖 Alimento da Alma: Sabia que ler a Bíblia por 15 minutos ao dia permite concluir o Novo Testamento em menos de um ano?'
    ];
  }

  // 2. Streak evaluation
  if (streak >= 5) {
    insights.push(`🔥 Sua chama está ardendo firme! Você está em uma sequência gloriosa de ${streak} dias seguidos. Continue com essa vigilância espiritual.`);
  } else if (streak === 0) {
    insights.push('🕯️ Altar Desligado: Sua sequência caiu a zero. Que tal reiniciar sua caminhada hoje mesmo com um breve clamor de 5 minutos?');
  }

  // 3. Trends in Reading vs Prayer
  const today = new Date();
  const past7Days = getPastDates(7);
  const past14to8Days = getPastDates(14).slice(0, 7);

  let thisWeekMins = 0;
  let lastWeekMins = 0;
  let thisWeekReading = 0;
  let lastWeekReading = 0;

  history.forEach(day => {
    let pSecs = 0;
    let rSecs = 0;
    if (day.sessions && day.sessions.length > 0) {
      day.sessions.forEach(s => {
        if (s.tag === 'leitura') rSecs += s.durationSeconds;
        else pSecs += s.durationSeconds;
      });
    } else {
      pSecs += day.meditationSeconds || 0;
    }

    const pMin = Math.round(pSecs / 60);
    const rMin = Math.round(rSecs / 60);

    if (past7Days.includes(day.date)) {
      thisWeekMins += pMin;
      thisWeekReading += rMin;
    } else if (past14to8Days.includes(day.date)) {
      lastWeekMins += pMin;
      lastWeekReading += rMin;
    }
  });

  // Check prayer trend
  if (lastWeekMins > 0) {
    const ratio = (thisWeekMins - lastWeekMins) / lastWeekMins;
    if (ratio >= 0.1) {
      insights.push(`📈 Comunhão em Alta: Você dedicou ${thisWeekMins} min em oração esta semana, um aumento abençoado de ${Math.round(ratio * 100)}% em relação à semana passada!`);
    } else if (ratio <= -0.1) {
      insights.push(`⚠️ Alerta de Oração: Suas preces caíram ${Math.abs(Math.round(ratio * 100))}% esta semana. Encontre um local pacífico e reconecte-se com o Pai.`);
    }
  }

  // Check reading trend
  if (lastWeekReading > 0) {
    const rRatio = (thisWeekReading - lastWeekReading) / lastWeekReading;
    if (rRatio <= -0.15) {
      insights.push(`⚠️ Fome da Palavra: Seu tempo de leitura da Bíblia caiu ${Math.abs(Math.round(rRatio * 100))}% esta semana. Lembre-se: "Nem só de pão viverá o homem, mas de toda a Palavra".`);
    } else if (rRatio >= 0.15) {
      insights.push(`📚 Sabedoria Crescente: Seu tempo de estudo bíblico aumentou +${Math.round(rRatio * 100)}% nos últimos dias. Sua clareza espiritual florescerá.`);
    }
  }

  // Habit specific hints
  const totalCompletedInHistory = history.reduce((sum, h) => sum + (h.habitsCompleted?.length || 0), 0);
  const possibleCompletionsInHistory = history.length * habits.length;
  if (possibleCompletionsInHistory > 0) {
    const rate = Math.round((totalCompletedInHistory / possibleCompletionsInHistory) * 100);
    if (rate < 50) {
      insights.push(`🎯 Dica de Disciplina: Sua taxa geral de conclusão de hábitos é de ${rate}%. Experimente definir horários recomendados (Ex: oração pela manhã, diário à noite) para facilitar a rotina!`);
    } else {
      insights.push(`🌟 Exemplo de Constância: Incrível! Você cumpre em média ${rate}% de seus hábitos de fé diariamente. Você está assentando alicerces inabaláveis.`);
    }
  }

  return insights.slice(0, 3); // Return at most 3 relevant messages
}
