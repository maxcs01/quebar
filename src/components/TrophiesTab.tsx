import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award,
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  Milestone,
  Compass,
  CheckCircle,
  TrendingUp,
  Lock,
  Unlock,
  HeartHandshake,
  Search,
  CheckSquare,
  BookMarked,
  Hourglass,
  HelpCircle
} from 'lucide-react';
import { Habit, DayProgress, UserProfile } from '../types';
import { NEW_TROPHIES, Trophy } from '../data/trophiesData';
import { getLevelTitle, getXPForNextLevel, LEVEL_THRESHOLDS } from '../data/defaultData';

interface TrophiesTabProps {
  key?: string;
  profile: UserProfile;
  habits: Habit[];
  history: DayProgress[];
}

export default function TrophiesTab({ profile, habits, history }: TrophiesTabProps) {
  // Navigation categories for trophies filter
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'oracao' | 'ofensivas' | 'leitura'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrophyForPopup, setSelectedTrophyForPopup] = useState<any | null>(null);

  // 1. STATS ACCUMULATION & EXTRACTOR
  // Prayer (ORACAO) Stats accumulation
  const {
    totalPrayerSeconds,
    maxSinglePrayerSeconds,
    maxPrayerInSingleDay,
    hasDawnSession,
    hasNoonSession,
    hasNightSession,
    turnActivityMap,
    prayerDates
  } = useMemo(() => {
    let totalPrayer = 0;
    let maxSinglePrayer = 0;
    let dailyPrayerSum: { [date: string]: number } = {};
    let turnsMap: { [date: string]: Set<string> } = {};
    let dawn = false;
    let noon = false;
    let night = false;
    const datesSet = new Set<string>();

    history.forEach(day => {
      let daySum = 0;
      const dStr = day.date;
      if (!turnsMap[dStr]) turnsMap[dStr] = new Set<string>();

      if (day.sessions && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          if (s.tag !== 'leitura') {
            const secs = s.durationSeconds;
            totalPrayer += secs;
            daySum += secs;
            datesSet.add(dStr);

            if (secs > maxSinglePrayer) maxSinglePrayer = secs;

            // Extract Local Hours
            const hr = new Date(s.timestamp).getHours();

            // Madrugada: 3h to 4h59
            if (hr >= 3 && hr < 5) dawn = true;
            // Almoço: 12h to 13h59
            if (hr >= 12 && hr < 14) noon = true;
            // Noite: After 23h
            if (hr >= 23 || hr < 3) night = true;

            // Turn splits: Manhã (5-12), Tarde (12-18), Noite (18-5)
            if (hr >= 5 && hr < 12) turnsMap[dStr].add('manha');
            else if (hr >= 12 && hr < 18) turnsMap[dStr].add('tarde');
            else turnsMap[dStr].add('noite');
          }
        });
      } else if (day.meditationSeconds > 0) {
        // Fallback for native meditation seconds
        totalPrayer += day.meditationSeconds;
        daySum += day.meditationSeconds;
        datesSet.add(dStr);
        if (day.meditationSeconds > maxSinglePrayer) maxSinglePrayer = day.meditationSeconds;
        turnsMap[dStr].add('tarde');
      }

      dailyPrayerSum[dStr] = (dailyPrayerSum[dStr] || 0) + daySum;
    });

    const maxDay = Object.values(dailyPrayerSum).length > 0 ? Math.max(...Object.values(dailyPrayerSum)) : 0;
    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
      totalPrayerSeconds: totalPrayer,
      maxSinglePrayerSeconds: maxSinglePrayer,
      maxPrayerInSingleDay: maxDay,
      hasDawnSession: dawn,
      hasNoonSession: noon,
      hasNightSession: night,
      turnActivityMap: turnsMap,
      prayerDates: sortedDates
    };
  }, [history]);

  // Overall Max Streak for Prayer
  const { maxStreak, activeStreak, hasResiliencia } = useMemo(() => {
    let maxStrk = 0;
    let tempStrk = 0;
    let lastDate: Date | null = null;

    prayerDates.forEach(dStr => {
      const currDate = new Date(dStr + 'T12:00:00');
      if (!lastDate) {
        tempStrk = 1;
      } else {
        const diff = currDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStrk++;
        } else if (diffDays > 1) {
          if (tempStrk > maxStrk) maxStrk = tempStrk;
          tempStrk = 1;
        }
      }
      lastDate = currDate;
    });
    if (tempStrk > maxStrk) maxStrk = tempStrk;

    // Resiliencia logic checking
    let resiliencia = false;
    for (let i = 0; i < prayerDates.length - 1; i++) {
      const d1 = new Date(prayerDates[i] + 'T12:00:00');
      const d2 = new Date(prayerDates[i+1] + 'T12:00:00');
      const gap = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      
      if (gap > 1) {
        // Gap identified! Did they have a streak of >= 7 before, and >= 3 directly after?
        let beforeCount = 1;
        let cBefore = d1;
        for (let j = i - 1; j >= 0; j--) {
          const prev = new Date(prayerDates[j] + 'T12:00:00');
          if (Math.round((cBefore.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)) === 1) {
            beforeCount++;
            cBefore = prev;
          } else break;
        }

        let afterCount = 1;
        let cAfter = d2;
        for (let k = i + 1; k < prayerDates.length - 1; k++) {
          const next = new Date(prayerDates[k+1] + 'T12:00:00');
          if (Math.round((next.getTime() - cAfter.getTime()) / (1000 * 60 * 60 * 24)) === 1) {
            afterCount++;
            cAfter = next;
          } else break;
        }

        if (beforeCount >= 7 && afterCount >= 3) {
          resiliencia = true;
          break;
        }
      }
    }

    return {
      maxStreak: maxStrk,
      activeStreak: profile.streak,
      hasResiliencia: resiliencia
    };
  }, [prayerDates, profile.streak]);

  // Reading (LEITURA) Stats accumulation
  const {
    totalReadingSeconds,
    maxSingleReadingSeconds,
    maxReadingInSingleDay,
    hasLeitorNoturno,
    hasPrimeirosFrutos,
    hasDeDiaEDeNoite,
    maxStreakReading
  } = useMemo(() => {
    let totalReading = 0;
    let maxSingleReading = 0;
    let dailyReadingSum: { [date: string]: number } = {};
    let dawnReading = false; // before 8:00
    let nightReading = false; // after 22:00
    let twinReadDays = new Set<string>(); // morning and evening read on same day
    const readingDatesSet = new Set<string>();

    history.forEach(day => {
      let daySum = 0;
      const dStr = day.date;
      
      let isAMRead = false;
      let isPMRead = false;

      if (day.sessions && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          if (s.tag === 'leitura') {
            const secs = s.durationSeconds;
            totalReading += secs;
            daySum += secs;
            readingDatesSet.add(dStr);

            if (secs > maxSingleReading) maxSingleReading = secs;

            const hr = new Date(s.timestamp).getHours();

            // Leitor Noturno: starts after 22h
            if (hr >= 22 || hr < 4) nightReading = true;
            // Primeiros Frutos: starts before 8h
            if (hr >= 4 && hr < 8) dawnReading = true;

            // Period evaluation for twinRead (AM and PM reading on the same day)
            if (hr >= 4 && hr < 12) isAMRead = true;
            if (hr >= 18 || hr < 4) isPMRead = true;
          }
        });
      }

      if (isAMRead && isPMRead) {
        twinReadDays.add(dStr);
      }

      dailyReadingSum[dStr] = (dailyReadingSum[dStr] || 0) + daySum;
    });

    const maxDayRead = Object.values(dailyReadingSum).length > 0 ? Math.max(...Object.values(dailyReadingSum)) : 0;
    const sortedReadingDates = Array.from(readingDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Compute Reading Streak
    let maxStrkRead = 0;
    let tempStrkRead = 0;
    let lastDateRead: Date | null = null;

    sortedReadingDates.forEach(dStr => {
      const currDate = new Date(dStr + 'T12:00:00');
      if (!lastDateRead) {
        tempStrkRead = 1;
      } else {
        const diff = currDate.getTime() - lastDateRead.getTime();
        const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStrkRead++;
        } else if (diffDays > 1) {
          if (tempStrkRead > maxStrkRead) maxStrkRead = tempStrkRead;
          tempStrkRead = 1;
        }
      }
      lastDateRead = currDate;
    });
    if (tempStrkRead > maxStrkRead) maxStrkRead = tempStrkRead;

    return {
      totalReadingSeconds: totalReading,
      maxSingleReadingSeconds: maxSingleReading,
      maxReadingInSingleDay: maxDayRead,
      hasLeitorNoturno: nightReading,
      hasPrimeirosFrutos: dawnReading,
      hasDeDiaEDeNoite: twinReadDays.size > 0,
      maxStreakReading: maxStrkRead
    };
  }, [history]);


  // 2. EVALUATED TROPHIES MAPPING ENGINE
  const evaluatedTrophies = useMemo(() => {
    return NEW_TROPHIES.map(trophy => {
      let currentValue = 0;
      let unlocked = false;
      let progressPercent = 0;

      switch (trophy.id) {
        // --- CATEGORIA 1: ORAÇÃO (tr-oracao-1 a tr-oracao-17) ---
        case 'tr-oracao-1':
          currentValue = Math.round(totalPrayerSeconds / 60);
          unlocked = totalPrayerSeconds >= 60;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 60) * 100), 100);
          break;
        case 'tr-oracao-2':
          currentValue = Math.round(maxSinglePrayerSeconds / 60);
          unlocked = maxSinglePrayerSeconds >= 300;
          progressPercent = Math.min(Math.round((maxSinglePrayerSeconds / 300) * 100), 100);
          break;
        case 'tr-oracao-3':
          currentValue = Math.round(maxSinglePrayerSeconds / 60);
          unlocked = maxSinglePrayerSeconds >= 600;
          progressPercent = Math.min(Math.round((maxSinglePrayerSeconds / 600) * 100), 100);
          break;
        case 'tr-oracao-4':
          currentValue = Math.round(maxSinglePrayerSeconds / 60);
          unlocked = maxSinglePrayerSeconds >= 900;
          progressPercent = Math.min(Math.round((maxSinglePrayerSeconds / 900) * 100), 100);
          break;
        case 'tr-oracao-5':
          currentValue = Math.round(maxSinglePrayerSeconds / 60);
          unlocked = maxSinglePrayerSeconds >= 1800;
          progressPercent = Math.min(Math.round((maxSinglePrayerSeconds / 1800) * 100), 100);
          break;
        case 'tr-oracao-6':
          currentValue = Math.round(maxSinglePrayerSeconds / 60);
          unlocked = maxSinglePrayerSeconds >= 3600;
          progressPercent = Math.min(Math.round((maxSinglePrayerSeconds / 3600) * 100), 100);
          break;
        case 'tr-oracao-7':
          currentValue = Math.round(maxPrayerInSingleDay / 60);
          unlocked = maxPrayerInSingleDay >= 7200;
          progressPercent = Math.min(Math.round((maxPrayerInSingleDay / 7200) * 100), 100);
          break;
        case 'tr-oracao-8':
          currentValue = Math.round(totalPrayerSeconds / 60);
          unlocked = totalPrayerSeconds >= 7200;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 7200) * 100), 100);
          break;
        case 'tr-oracao-9':
          currentValue = Math.round(totalPrayerSeconds / 3600);
          unlocked = totalPrayerSeconds >= 18000;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 18000) * 100), 100);
          break;
        case 'tr-oracao-10':
          currentValue = Math.round(totalPrayerSeconds / 3600);
          unlocked = totalPrayerSeconds >= 36000;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 36000) * 100), 100);
          break;
        case 'tr-oracao-11':
          currentValue = Math.round(totalPrayerSeconds / 3600);
          unlocked = totalPrayerSeconds >= 86400;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 86400) * 100), 100);
          break;
        case 'tr-oracao-12':
          currentValue = Math.round(totalPrayerSeconds / 3600);
          unlocked = totalPrayerSeconds >= 180000;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 180000) * 100), 100);
          break;
        case 'tr-oracao-13':
          currentValue = Math.round(totalPrayerSeconds / 3600);
          unlocked = totalPrayerSeconds >= 360000;
          progressPercent = Math.min(Math.round((totalPrayerSeconds / 360000) * 100), 100);
          break;
        case 'tr-oracao-14':
          const maxTurnsInOneDay = Object.values(turnActivityMap as Record<string, Set<string>>).reduce((max: number, set: Set<string>) => Math.max(max, set.size), 0);
          currentValue = maxTurnsInOneDay;
          unlocked = maxTurnsInOneDay >= 3;
          progressPercent = Math.min(Math.round((maxTurnsInOneDay / 3) * 100), 100);
          break;
        case 'tr-oracao-15':
          currentValue = hasDawnSession ? 1 : 0;
          unlocked = hasDawnSession;
          progressPercent = hasDawnSession ? 100 : 0;
          break;
        case 'tr-oracao-16':
          currentValue = hasNoonSession ? 1 : 0;
          unlocked = hasNoonSession;
          progressPercent = hasNoonSession ? 100 : 0;
          break;
        case 'tr-oracao-17':
          currentValue = hasNightSession ? 1 : 0;
          unlocked = hasNightSession;
          progressPercent = hasNightSession ? 100 : 0;
          break;

        // --- CATEGORIA 2: OFENSIVAS (tr-ofensivas-18 a tr-ofensivas-34) ---
        case 'tr-ofensivas-18':
          currentValue = prayerDates.length;
          unlocked = prayerDates.length >= 1;
          progressPercent = Math.min(Math.round((prayerDates.length / 1) * 100), 100);
          break;
        case 'tr-ofensivas-19':
          currentValue = maxStreak;
          unlocked = maxStreak >= 3;
          progressPercent = Math.min(Math.round((maxStreak / 3) * 100), 100);
          break;
        case 'tr-ofensivas-20':
          currentValue = maxStreak;
          unlocked = maxStreak >= 5;
          progressPercent = Math.min(Math.round((maxStreak / 5) * 100), 100);
          break;
        case 'tr-ofensivas-21':
          currentValue = maxStreak;
          unlocked = maxStreak >= 7;
          progressPercent = Math.min(Math.round((maxStreak / 7) * 100), 100);
          break;
        case 'tr-ofensivas-22':
          currentValue = maxStreak;
          unlocked = maxStreak >= 10;
          progressPercent = Math.min(Math.round((maxStreak / 10) * 100), 100);
          break;
        case 'tr-ofensivas-23':
          currentValue = maxStreak;
          unlocked = maxStreak >= 15;
          progressPercent = Math.min(Math.round((maxStreak / 15) * 100), 100);
          break;
        case 'tr-ofensivas-24':
          currentValue = maxStreak;
          unlocked = maxStreak >= 21;
          progressPercent = Math.min(Math.round((maxStreak / 21) * 100), 100);
          break;
        case 'tr-ofensivas-25':
          currentValue = maxStreak;
          unlocked = maxStreak >= 30;
          progressPercent = Math.min(Math.round((maxStreak / 30) * 100), 100);
          break;
        case 'tr-ofensivas-26':
          currentValue = maxStreak;
          unlocked = maxStreak >= 40;
          progressPercent = Math.min(Math.round((maxStreak / 40) * 100), 100);
          break;
        case 'tr-ofensivas-27':
          currentValue = maxStreak;
          unlocked = maxStreak >= 50;
          progressPercent = Math.min(Math.round((maxStreak / 50) * 100), 100);
          break;
        case 'tr-ofensivas-28':
          currentValue = maxStreak;
          unlocked = maxStreak >= 90;
          progressPercent = Math.min(Math.round((maxStreak / 90) * 100), 100);
          break;
        case 'tr-ofensivas-29':
          currentValue = maxStreak;
          unlocked = maxStreak >= 100;
          progressPercent = Math.min(Math.round((maxStreak / 100) * 100), 100);
          break;
        case 'tr-ofensivas-30':
          currentValue = maxStreak;
          unlocked = maxStreak >= 180;
          progressPercent = Math.min(Math.round((maxStreak / 180) * 100), 100);
          break;
        case 'tr-ofensivas-31':
          currentValue = maxStreak;
          unlocked = maxStreak >= 365;
          progressPercent = Math.min(Math.round((maxStreak / 365) * 100), 100);
          break;
        case 'tr-ofensivas-32':
          currentValue = hasResiliencia ? 3 : 0;
          unlocked = hasResiliencia;
          progressPercent = hasResiliencia ? 100 : 0;
          break;
        case 'tr-ofensivas-33':
          // Saturday and Sunday active weekends counter
          const weekendDaysCount = history.filter(day => {
            const dateObj = new Date(day.date + 'T12:00:00');
            const dy = dateObj.getDay();
            const hasActivity = day.meditationSeconds > 0 || (day.habitsCompleted && day.habitsCompleted.length > 0);
            return (dy === 0 || dy === 6) && hasActivity;
          }).length;
          // Approximate weekend sets (2 consecutive active weekend days)
          const equivWeekends = Math.floor(weekendDaysCount / 2);
          currentValue = equivWeekends;
          unlocked = equivWeekends >= 4;
          progressPercent = Math.min(Math.round((equivWeekends / 4) * 100), 100);
          break;
        case 'tr-ofensivas-34':
          currentValue = maxStreak;
          unlocked = maxStreak >= 500;
          progressPercent = Math.min(Math.round((maxStreak / 500) * 100), 100);
          break;

        // --- CATEGORIA 3: LEITURA (tr-leitura-35 a tr-leitura-50) ---
        case 'tr-leitura-35':
          currentValue = Math.round(totalReadingSeconds / 60);
          unlocked = totalReadingSeconds >= 300;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 300) * 100), 100);
          break;
        case 'tr-leitura-36':
          currentValue = Math.round(maxSingleReadingSeconds / 60);
          unlocked = maxSingleReadingSeconds >= 600;
          progressPercent = Math.min(Math.round((maxSingleReadingSeconds / 600) * 100), 100);
          break;
        case 'tr-leitura-37':
          currentValue = Math.round(maxSingleReadingSeconds / 60);
          unlocked = maxSingleReadingSeconds >= 1200;
          progressPercent = Math.min(Math.round((maxSingleReadingSeconds / 1200) * 100), 100);
          break;
        case 'tr-leitura-38':
          currentValue = Math.round(maxSingleReadingSeconds / 60);
          unlocked = maxSingleReadingSeconds >= 1800;
          progressPercent = Math.min(Math.round((maxSingleReadingSeconds / 1800) * 100), 100);
          break;
        case 'tr-leitura-39':
          currentValue = Math.round(maxReadingInSingleDay / 60);
          unlocked = maxReadingInSingleDay >= 3600;
          progressPercent = Math.min(Math.round((maxReadingInSingleDay / 3600) * 100), 100);
          break;
        case 'tr-leitura-40':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 18000;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 18000) * 100), 100);
          break;
        case 'tr-leitura-41':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 36000;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 36000) * 100), 100);
          break;
        case 'tr-leitura-42':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 86400;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 86400) * 100), 100);
          break;
        case 'tr-leitura-43':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 180000;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 180000) * 100), 100);
          break;
        case 'tr-leitura-44':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 360000;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 360000) * 100), 100);
          break;
        case 'tr-leitura-45':
          currentValue = Math.round(totalReadingSeconds / 3600);
          unlocked = totalReadingSeconds >= 720000;
          progressPercent = Math.min(Math.round((totalReadingSeconds / 720000) * 100), 100);
          break;
        case 'tr-leitura-46':
          currentValue = hasLeitorNoturno ? 1 : 0;
          unlocked = hasLeitorNoturno;
          progressPercent = hasLeitorNoturno ? 100 : 0;
          break;
        case 'tr-leitura-47':
          currentValue = hasPrimeirosFrutos ? 1 : 0;
          unlocked = hasPrimeirosFrutos;
          progressPercent = hasPrimeirosFrutos ? 100 : 0;
          break;
        case 'tr-leitura-48':
          currentValue = hasDeDiaEDeNoite ? 1 : 0;
          unlocked = hasDeDiaEDeNoite;
          progressPercent = hasDeDiaEDeNoite ? 100 : 0;
          break;
        case 'tr-leitura-49':
          currentValue = maxStreakReading;
          unlocked = maxStreakReading >= 7;
          progressPercent = Math.min(Math.round((maxStreakReading / 7) * 100), 100);
          break;
        case 'tr-leitura-50':
          currentValue = maxStreakReading;
          unlocked = maxStreakReading >= 30;
          progressPercent = Math.min(Math.round((maxStreakReading / 30) * 100), 100);
          break;
        default:
          break;
      }

      return {
        ...trophy,
        unlocked,
        currentValue,
        progressPercent
      };
    });
  }, [
    totalPrayerSeconds,
    maxSinglePrayerSeconds,
    maxPrayerInSingleDay,
    hasDawnSession,
    hasNoonSession,
    hasNightSession,
    turnActivityMap,
    prayerDates,
    maxStreak,
    hasResiliencia,
    totalReadingSeconds,
    maxSingleReadingSeconds,
    maxReadingInSingleDay,
    hasLeitorNoturno,
    hasPrimeirosFrutos,
    hasDeDiaEDeNoite,
    maxStreakReading,
    history
  ]);

  // CATEGORY TOKENS AND COUNTINGS
  const activeTrophiesList = useMemo(() => {
    return evaluatedTrophies.filter(t => {
      // Search Box Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesQuery = t.title.toLowerCase().includes(query) || t.requirement.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Tab Menu Category
      if (selectedCategory === 'all') return true;
      return t.category === selectedCategory;
    });
  }, [evaluatedTrophies, selectedCategory, searchQuery]);

  // Overall statistics count
  const statsOverview = useMemo(() => {
    const totalCount = evaluatedTrophies.length;
    const unlockedCount = evaluatedTrophies.filter(t => t.unlocked).length;

    const oracaoTotal = evaluatedTrophies.filter(t => t.category === 'oracao').length;
    const oracaoUnlocked = evaluatedTrophies.filter(t => t.category === 'oracao' && t.unlocked).length;

    const ofensivasTotal = evaluatedTrophies.filter(t => t.category === 'ofensivas').length;
    const ofensivasUnlocked = evaluatedTrophies.filter(t => t.category === 'ofensivas' && t.unlocked).length;

    const leituraTotal = evaluatedTrophies.filter(t => t.category === 'leitura').length;
    const leituraUnlocked = evaluatedTrophies.filter(t => t.category === 'leitura' && t.unlocked).length;

    return {
      total: totalCount,
      unlocked: unlockedCount,
      percent: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
      oracao: { unlocked: oracaoUnlocked, total: oracaoTotal },
      ofensivas: { unlocked: ofensivasUnlocked, total: ofensivasTotal },
      leitura: { unlocked: leituraUnlocked, total: leituraTotal }
    };
  }, [evaluatedTrophies]);

  // Level thresholds offset
  const nextLevelXPNeeded = useMemo(() => {
    return getXPForNextLevel(profile.level);
  }, [profile.level]);

  const previousLevelThreshold = useMemo(() => {
    const current = LEVEL_THRESHOLDS.find(t => t.level === profile.level);
    return current ? current.xpNeeded : 0;
  }, [profile.level]);

  const levelProgressPercent = useMemo(() => {
    const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === profile.level + 1);
    if (!nextLevel) return 100;
    const gainedInThisLevel = profile.xp - previousLevelThreshold;
    const ratio = gainedInThisLevel / nextLevelXPNeeded;
    return Math.min(Math.max(Math.round(ratio * 100), 0), 100);
  }, [profile.xp, previousLevelThreshold, nextLevelXPNeeded, profile.level]);

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
        <h2 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <Award className="text-amber-500 w-6 h-6 animate-pulse" />
          Seus Trunfos &amp; Medalhas Animadas
        </h2>
        <p className="text-slate-400 text-sm">
          A perseverança diária solidifica os hábitos. Conquiste medalhas animadas e eleve seu patamar evolutivo diário.
        </p>
      </div>

      {/* Profile summary card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-x-12 translate-y-1 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-indigo-500 p-[2px] flex items-center justify-center shadow-lg shadow-amber-950/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider leading-none">Nível</span>
                <span className="text-2xl font-black text-slate-100 font-mono mt-0.5 leading-none">{profile.level}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-amber-400 font-bold px-2.5 py-0.5 bg-amber-400/10 rounded-full border border-amber-400/20">
                {getLevelTitle(profile.level)}
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center gap-1.5">
                Caminhada de {profile.name || 'Praticante'}
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Acumulado total de <span className="font-mono text-slate-200 font-bold">{profile.xp} XP</span>
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                Progresso Geral de Títulos
              </span>
              <span className="text-slate-200 font-mono font-bold">
                {profile.xp - previousLevelThreshold} / {nextLevelXPNeeded} XP
              </span>
            </div>

            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-indigo-500 rounded-full"
              />
            </div>
            
            <p className="text-[10px] text-slate-500 mt-2 text-right">
              Faltam {nextLevelXPNeeded - (profile.xp - previousLevelThreshold)} XP para a próxima evolução espiritual.
            </p>
          </div>
        </div>

        {/* Global Level Path Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/60 text-center">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Medalhas Ativas</span>
            <span className="text-xl font-black text-amber-500 font-mono mt-0.5">{statsOverview.unlocked} / {statsOverview.total}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Tempo de Oração</span>
            <span className="text-xl font-black text-indigo-400 font-mono mt-0.5">
              {Math.round(totalPrayerSeconds / 60)} min
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Ofensiva Máxima</span>
            <span className="text-xl font-black text-orange-400 font-mono mt-0.5">{maxStreak} dias</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Leitura Bíblica</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {Math.round(totalReadingSeconds / 60)} min
            </span>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH WRAPPER & SUBCATEGORY MENU */}
      <div className="space-y-4">
        
        {/* Search Input Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome de medalha ou requisito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 rounded-2xl py-3 pl-11 pr-4 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-amber-500/10"
          />
        </div>

        {/* Categories Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-900/60 border border-slate-850 rounded-2xl">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-1 min-w-[80px] text-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 rounded-xl cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ver Tudo ({statsOverview.unlocked})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('oracao')}
            className={`flex-1 min-w-[120px] text-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'oracao'
                ? 'bg-indigo-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>🕒 Oração ({statsOverview.oracao.unlocked}/{statsOverview.oracao.total})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('ofensivas')}
            className={`flex-1 min-w-[120px] text-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'ofensivas'
                ? 'bg-orange-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🔥 Ofensivas ({statsOverview.ofensivas.unlocked}/{statsOverview.ofensivas.total})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('leitura')}
            className={`flex-1 min-w-[120px] text-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'leitura'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 Leitura ({statsOverview.leitura.unlocked}/{statsOverview.leitura.total})</span>
          </button>
        </div>

      </div>

      {/* DETAILED TROPHIES RESPONSIVE GRID GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {activeTrophiesList.map((trophy, index) => {
            const categoryColorScheme = 
              trophy.category === 'oracao'
                ? {
                    primary: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
                    glow: 'from-indigo-500/10 to-indigo-500/5 bg-indigo-500/20',
                    unlockedLabel: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
                    bar: 'bg-indigo-400'
                  }
                : trophy.category === 'ofensivas'
                ? {
                    primary: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
                    glow: 'from-orange-500/10 to-orange-500/5 bg-orange-500/20',
                    unlockedLabel: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
                    bar: 'bg-orange-400'
                  }
                : {
                    primary: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                    glow: 'from-emerald-500/10 to-emerald-500/5 bg-emerald-500/20',
                    unlockedLabel: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                    bar: 'bg-emerald-400'
                  };

            return (
              <motion.div
                key={trophy.id}
                layout
                onClick={() => setSelectedTrophyForPopup(trophy)}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-slate-700/80 hover:shadow-indigo-950/20 active:scale-[0.98] ${
                  trophy.unlocked 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 shadow-xl hover:scale-[1.02]' 
                    : 'bg-slate-900/40 border-slate-900/60 opacity-60 hover:opacity-95 hover:scale-[1.01]'
                }`}
              >
                {/* Floating badge top right */}
                <div className="absolute right-3.5 top-3.5">
                  {trophy.unlocked ? (
                    <span className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${categoryColorScheme.unlockedLabel}`}>
                      <Unlock className="w-2.5 h-2.5" /> Desbravada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850 uppercase tracking-wide">
                      <Lock className="w-2.5 h-2.5" /> Bloqueada
                    </span>
                  )}
                </div>

                <div className="flex gap-4 items-start">
                  
                  {/* Animated Emoji Badge Slot */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border relative overflow-hidden transition-transform ${
                    trophy.unlocked 
                      ? 'bg-slate-950 border-slate-800' 
                      : 'bg-slate-955 border-slate-850 opacity-40'
                  }`}>
                    
                    {/* Glowing circular aura expanding inside */}
                    {trophy.unlocked && (
                      <motion.div 
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.15, 0.4, 0.15]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute inset-0 rounded-full blur-sm bg-gradient-to-tr ${categoryColorScheme.glow}`}
                      />
                    )}
                    
                    <span className={`text-2xl select-none block relative z-10 transition-transform ${
                      trophy.unlocked ? 'animate-bounce scale-110 mb-0.5' : 'grayscale filter opacity-60'
                    }`} style={{ animationDuration: trophy.unlocked ? '2.5s' : '0s' }}>
                      {trophy.emoji}
                    </span>
                    
                    <span className="text-[7px] select-none text-slate-500 font-mono tracking-wider font-extrabold uppercase relative z-10">
                      ID: {trophy.id.split('-')[2]}
                    </span>
                  </div>

                  {/* Descriptions block */}
                  <div className="flex-1 pr-14 space-y-1">
                    <h4 className={`font-extrabold text-sm tracking-tight ${trophy.unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                      {trophy.title}
                    </h4>
                    
                    <p className="text-[10px] text-slate-400 font-mono leading-tight">
                      <span className="text-amber-500 font-bold">Requisito:</span> {trophy.requirement}
                    </p>

                    {/* Completion Message Block (Shows as animated quoting bubbles when unlocked) */}
                    {trophy.unlocked && (
                      <motion.p 
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-indigo-200/90 italic leading-relaxed border-l border-amber-500/20 pl-2 mt-2"
                      >
                        "{trophy.message}"
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Progress bar metrics inside card */}
                <div className="mt-4 pt-3 border-t border-slate-900 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Estado do Progresso:</span>
                    <span className={trophy.unlocked ? 'text-emerald-400 font-extrabold' : 'font-bold text-slate-400'}>
                      {trophy.currentValue} / {trophy.requirementValue} {trophy.category === 'ofensivas' ? 'dias' : 'min'}
                    </span>
                  </div>
                  
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900/60">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, trophy.progressPercent)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${trophy.unlocked ? categoryColorScheme.bar : 'bg-slate-800'}`}
                    />
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {activeTrophiesList.length === 0 && (
          <div className="md:col-span-2 py-12 text-center text-slate-500 border border-dashed border-slate-850 rounded-3xl space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold">Nenhuma medalha corresponde aos filtros ativos.</p>
            <p className="text-[10px] text-slate-400">Tente buscar por termos diferentes ou selecione outra categoria.</p>
          </div>
        )}
      </div>

      {/* Helpful Legend Guide */}
      <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 text-xs text-slate-400 space-y-3">
        <h4 className="font-extrabold text-slate-200 flex items-center gap-1">
          <HeartHandshake className="w-4 h-4 text-amber-500" />
          Como Ativar Seus Trunfos Especiais?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] leading-relaxed">
          <div className="space-y-1">
            <strong className="text-indigo-400 block font-bold">🕒 Categoria Oração:</strong>
            <p>Selecione as tags de períodos (Despertar, Manhã, Noite, Aleatório) ao usar o cronômetro para cumular tempo de adoração diária.</p>
          </div>
          <div className="space-y-1">
            <strong className="text-orange-400 block font-bold">🔥 Categoria Ofensivas:</strong>
            <p>Mantenha sequências consistentes diárias de devoção de oração para manter a chama do seu propósito sempre acesa!</p>
          </div>
          <div className="space-y-1">
            <strong className="text-emerald-400 block font-bold">📖 Categoria Leitura:</strong>
            <p>Selecione a tag "Tempo de Leitura" ao usar o cronômetro para registrar e acumular estudos com as Escrituras no app.</p>
          </div>
        </div>
      </div>

      {/* Trophy detailed popup with custom spiritual message and micro animations */}
      <AnimatePresence>
        {selectedTrophyForPopup && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle visual aura background depending on category */}
              <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-tr ${
                selectedTrophyForPopup.category === 'oracao'
                  ? 'from-indigo-500 to-indigo-300'
                  : selectedTrophyForPopup.category === 'ofensivas'
                  ? 'from-orange-500 to-amber-400'
                  : 'from-emerald-500 to-emerald-300'
              }`} />

              {/* Floating ID badge */}
              <div className="absolute right-4 top-4 text-[10px] font-mono font-bold text-slate-500">
                MEDALHA #{selectedTrophyForPopup.id.split('-')[2]}
              </div>

              {/* Icon Big Badge centered */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-20 h-20 rounded-3xl bg-slate-950 border border-slate-850 flex items-center justify-center relative shadow-lg ${
                  selectedTrophyForPopup.unlocked ? 'animate-bounce shadow-amber-500/5' : 'opacity-50'
                }`} style={{ animationDuration: '3s' }}>
                  
                  {selectedTrophyForPopup.unlocked && (
                    <span className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 blur animate-pulse" />
                  )}
                  
                  <span className={`text-4xl select-none relative z-10 ${!selectedTrophyForPopup.unlocked && 'grayscale'}`}>
                    {selectedTrophyForPopup.emoji}
                  </span>
                </div>

                <div>
                  <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border mb-1.5 ${
                    selectedTrophyForPopup.category === 'oracao'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : selectedTrophyForPopup.category === 'ofensivas'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {selectedTrophyForPopup.category === 'oracao' ? '🕒 Tempo de Oração' : selectedTrophyForPopup.category === 'ofensivas' ? '🔥 Dias Consecutivos' : '📖 Leitura Bíblica'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
                    {selectedTrophyForPopup.title}
                  </h3>
                </div>
              </div>

              {/* Message from the user request (appears in a nice speech bubble/block) */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-850/65 relative">
                {selectedTrophyForPopup.unlocked ? (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-amber-500 font-mono block uppercase tracking-widest text-center mb-1">MENSAGEM DE CONQUISTA</span>
                    <p className="text-slate-200 italic font-medium text-xs text-center leading-relaxed">
                      "{selectedTrophyForPopup.message}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-center py-2 font-sans">
                    <div className="flex justify-center text-slate-600 mb-1.5">
                      <Lock className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[200px] mx-auto">
                      Mensagem de conexão celestial oculta. Conclua o requisito para desvendar!
                    </p>
                  </div>
                )}
              </div>

              {/* Stats metric breakdown */}
              <div className="space-y-2">
                <div className="flex flex-col text-xs space-y-1 text-slate-400">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">REQUISITO:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedTrophyForPopup.requirement}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Seu Progresso:</span>
                  <span className={`font-black ${selectedTrophyForPopup.unlocked ? 'text-amber-500' : 'text-slate-300'}`}>
                    {selectedTrophyForPopup.currentValue} / {selectedTrophyForPopup.requirementValue} {selectedTrophyForPopup.category === 'ofensivas' ? 'dias' : 'min'}
                  </span>
                </div>

                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900/60 mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, selectedTrophyForPopup.progressPercent)}%` }}
                    className={`h-full rounded-full ${
                      selectedTrophyForPopup.category === 'oracao'
                        ? 'bg-indigo-400'
                        : selectedTrophyForPopup.category === 'ofensivas'
                        ? 'bg-orange-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>
              </div>

              {/* Button dismiss */}
              <button
                onClick={() => setSelectedTrophyForPopup(null)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md uppercase tracking-wider cursor-pointer transform hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                Prosseguir em Devoção
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
