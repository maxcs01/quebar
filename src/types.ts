export interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'spiritual' | 'meditation' | 'reading' | 'reflection' | 'gratitude';
  schedule: 'morning' | 'evening' | 'anytime';
  streak: number;
  maxStreak: number;
  history: string[]; // List of YYYY-MM-DD strings of completions
  createdAt: string;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  habitsCompleted: string[]; // Habit IDs completed on this day
  meditationSeconds: number; // Meditation timer duration on this day
  reflection?: string; // Daily spiritual journal note
  sessions?: {
    durationSeconds: number;
    tag: 'despertar' | 'manha' | 'noite' | 'aleatorio' | 'leitura';
    timestamp: string; // ISO string or time representation
  }[];
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  streak: number;
  maxStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  notificationPreferences: {
    enabled: boolean;
    morningTime: string;
    eveningTime: string;
  };
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  iconName: string; // Name for Lucide-React icons
  group: 'habit' | 'meditation' | 'streak' | 'level';
  requirementType: 'total_habits' | 'total_meditations' | 'meditation_minutes' | 'streak_days' | 'reached_level';
  requirementValue: number;
  emoji?: string; // Custom fun visual emoji representing the triumph
}

export interface TimerPreset {
  id: string;
  label: string;
  durationSeconds: number;
  timeOfDay: 'morning' | 'evening' | 'custom';
}
