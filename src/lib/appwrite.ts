import { Client, Databases } from 'appwrite';
import { UserProfile, Habit, DayProgress } from '../types';

const metaEnv = (import.meta as any).env || {};
const endpoint = metaEnv.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = metaEnv.VITE_APPWRITE_PROJECT_ID || '';
const databaseId = metaEnv.VITE_APPWRITE_DATABASE_ID || 'santuario_db';

const profileCollection = metaEnv.VITE_APPWRITE_PROFILE_COLLECTION_ID || 'santuario_perfil';
const habitsCollection = metaEnv.VITE_APPWRITE_HABITS_COLLECTION_ID || 'santuario_habitos';
const historyCollection = metaEnv.VITE_APPWRITE_HISTORY_COLLECTION_ID || 'santuario_historico';

export const isAppwriteConfigured = Boolean(
  projectId && 
  projectId !== 'undefined'
);

export const appwriteClient = isAppwriteConfigured
  ? new Client().setEndpoint(endpoint).setProject(projectId)
  : null;

export const appwriteDatabases = appwriteClient ? new Databases(appwriteClient) : null;

// Generate or retrieve persistent local user key to partition cloud storage row entries 
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('santuario_uid');
  if (!uid || uid.trim() === '') {
    uid = `usr${Math.random().toString(36).substring(2, 12)}`;
    localStorage.setItem('santuario_uid', uid);
  }
  return uid;
}

// 1. Sync structures to Cloud using update/create upsert protocol
export async function saveProfileToAppwrite(userId: string, profile: UserProfile) {
  if (!appwriteDatabases) return;
  const data = {
    name: profile.name || 'Praticante',
    level: profile.level,
    xp: profile.xp,
    streak: profile.streak,
    maxStreak: profile.maxStreak,
    lastActiveDate: profile.lastActiveDate,
    notificationPreferences: JSON.stringify(profile.notificationPreferences),
    updated_at: new Date().toISOString()
  };

  try {
    await appwriteDatabases.updateDocument(databaseId, profileCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await appwriteDatabases.createDocument(databaseId, profileCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument profile failed:', createErr.message);
      }
    } else {
      console.warn('Error saving profile in Appwrite:', error.message);
    }
  }
}

export async function saveHabitsToAppwrite(userId: string, habits: Habit[]) {
  if (!appwriteDatabases) return;
  const data = {
    habits_list: JSON.stringify(habits),
    updated_at: new Date().toISOString()
  };

  try {
    await appwriteDatabases.updateDocument(databaseId, habitsCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await appwriteDatabases.createDocument(databaseId, habitsCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument habits failed:', createErr.message);
      }
    } else {
      console.warn('Error saving habits in Appwrite:', error.message);
    }
  }
}

export async function saveHistoryToAppwrite(userId: string, history: DayProgress[]) {
  if (!appwriteDatabases) return;
  const data = {
    history_list: JSON.stringify(history),
    updated_at: new Date().toISOString()
  };

  try {
    await appwriteDatabases.updateDocument(databaseId, historyCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await appwriteDatabases.createDocument(databaseId, historyCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument history failed:', createErr.message);
      }
    } else {
      console.warn('Error saving history in Appwrite:', error.message);
    }
  }
}

// 2. Load all structures from Cloud
export async function loadUserDataFromAppwrite(userId: string): Promise<{
  profile: UserProfile | null;
  habits: Habit[] | null;
  history: DayProgress[] | null;
} | null> {
  if (!appwriteDatabases) return null;
  try {
    const [profileDoc, habitsDoc, historyDoc] = await Promise.allSettled([
      appwriteDatabases.getDocument(databaseId, profileCollection, userId),
      appwriteDatabases.getDocument(databaseId, habitsCollection, userId),
      appwriteDatabases.getDocument(databaseId, historyCollection, userId)
    ]);

    let profile: UserProfile | null = null;
    let habits: Habit[] | null = null;
    let history: DayProgress[] | null = null;

    if (profileDoc.status === 'fulfilled' && profileDoc.value) {
      const p = profileDoc.value as any;
      let parsedNotifs = { enabled: true, morningTime: '06:00', eveningTime: '21:00' };
      try {
        if (p.notificationPreferences) {
          parsedNotifs = JSON.parse(p.notificationPreferences);
        }
      } catch (e) {
        console.warn('Failed parsing notificationPreferences:', e);
      }
      profile = {
        name: p.name || 'Definir Nome',
        level: p.level || 1,
        xp: p.xp || 0,
        streak: p.streak || 0,
        maxStreak: p.maxStreak || 0,
        lastActiveDate: p.lastActiveDate || '',
        notificationPreferences: parsedNotifs
      };
    }

    if (habitsDoc.status === 'fulfilled' && habitsDoc.value) {
      try {
        const h = habitsDoc.value as any;
        if (h.habits_list) {
          habits = JSON.parse(h.habits_list);
        }
      } catch (e) {
        console.warn('Failed parsing habits_list:', e);
      }
    }

    if (historyDoc.status === 'fulfilled' && historyDoc.value) {
      try {
        const h = historyDoc.value as any;
        if (h.history_list) {
          history = JSON.parse(h.history_list);
        }
      } catch (e) {
        console.warn('Failed parsing history_list:', e);
      }
    }

    if (profile || habits || history) {
      return { profile, habits, history };
    }
    return null;
  } catch (err) {
    console.warn('Appwrite database loaded with error, falling back:', err);
    return null;
  }
}
