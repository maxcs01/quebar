import { Client, Databases } from 'appwrite';
import { UserProfile, Habit, DayProgress } from '../types';

export interface AppwriteKeys {
  endpoint: string;
  projectId: string;
  databaseId: string;
  profileCollection: string;
  habitsCollection: string;
  historyCollection: string;
}

export function getAppwriteConfig(): AppwriteKeys {
  const metaEnv = (import.meta as any).env || {};
  return {
    endpoint: localStorage.getItem('appwrite_endpoint') || metaEnv.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: localStorage.getItem('appwrite_project_id') || metaEnv.VITE_APPWRITE_PROJECT_ID || '6a1984eb00307378c411',
    databaseId: localStorage.getItem('appwrite_database_id') || metaEnv.VITE_APPWRITE_DATABASE_ID || 'santuario_db',
    profileCollection: localStorage.getItem('appwrite_profile_col') || metaEnv.VITE_APPWRITE_PROFILE_COLLECTION_ID || 'santuario_perfil',
    habitsCollection: localStorage.getItem('appwrite_habits_col') || metaEnv.VITE_APPWRITE_HABITS_COLLECTION_ID || 'santuario_habitos',
    historyCollection: localStorage.getItem('appwrite_history_col') || metaEnv.VITE_APPWRITE_HISTORY_COLLECTION_ID || 'santuario_historico',
  };
}

export function saveAppwriteConfig(keys: Partial<AppwriteKeys>) {
  if (keys.endpoint !== undefined) localStorage.setItem('appwrite_endpoint', keys.endpoint);
  if (keys.projectId !== undefined) {
    localStorage.setItem('appwrite_project_id', keys.projectId);
  }
  if (keys.databaseId !== undefined) localStorage.setItem('appwrite_database_id', keys.databaseId);
  if (keys.profileCollection !== undefined) localStorage.setItem('appwrite_profile_col', keys.profileCollection);
  if (keys.habitsCollection !== undefined) localStorage.setItem('appwrite_habits_col', keys.habitsCollection);
  if (keys.historyCollection !== undefined) localStorage.setItem('appwrite_history_col', keys.historyCollection);
}

export function isAppwriteConfigured(): boolean {
  const config = getAppwriteConfig();
  return Boolean(config.projectId && config.projectId.trim() !== '' && config.projectId !== 'undefined');
}

// Get active Databases client
function getDatabasesInstance(): { db: Databases; config: AppwriteKeys } | null {
  const config = getAppwriteConfig();
  if (!config.projectId || config.projectId.trim() === '' || config.projectId === 'undefined') {
    return null;
  }
  try {
    const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);
    return { db: new Databases(client), config };
  } catch (err) {
    console.warn('Failed creating Appwrite dynamic client:', err);
    return null;
  }
}

// Generate or retrieve persistent local user key to partition cloud storage row entries 
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('santuario_uid');
  if (!uid || uid.trim() === '') {
    uid = `usr${Math.random().toString(36).substring(2, 12)}`;
    localStorage.setItem('santuario_uid', uid);
  }
  return uid;
}

export function enrichError(error: any): any {
  if (!error) return error;
  const msg = error.message || String(error);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch') || msg.includes('Network Error')) {
    const customMessage = "Falha de Rede / CORS: Não foi possível conectar ao servidor Appwrite. Se você estiver usando um projeto próprio, registre a URL atual (ou '*') em 'Web Platforms' no console do Appwrite. Se estiver usando o padrão, verifique sua rede ou desative Ad-blockers / Brave Shields.";
    const newError = new Error(customMessage);
    (newError as any).originalMessage = msg;
    (newError as any).code = 'CORS_OR_NETWORK';
    return newError;
  }
  return error;
}

// 1. Sync structures to Cloud using update/create upsert protocol
export async function saveProfileToAppwrite(userId: string, profile: UserProfile) {
  const instance = getDatabasesInstance();
  if (!instance) return;
  const { db, config } = instance;
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
    await db.updateDocument(config.databaseId, config.profileCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await db.createDocument(config.databaseId, config.profileCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument profile failed:', createErr.message);
        throw createErr;
      }
    } else {
      const enriched = enrichError(error);
      console.warn('Error saving profile in Appwrite:', enriched.message);
      throw enriched;
    }
  }
}

export async function saveHabitsToAppwrite(userId: string, habits: Habit[]) {
  const instance = getDatabasesInstance();
  if (!instance) return;
  const { db, config } = instance;
  const data = {
    habits_list: JSON.stringify(habits),
    updated_at: new Date().toISOString()
  };

  try {
    await db.updateDocument(config.databaseId, config.habitsCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await db.createDocument(config.databaseId, config.habitsCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument habits failed:', createErr.message);
        throw createErr;
      }
    } else {
      const enriched = enrichError(error);
      console.warn('Error saving habits in Appwrite:', enriched.message);
      throw enriched;
    }
  }
}

export async function saveHistoryToAppwrite(userId: string, history: DayProgress[]) {
  const instance = getDatabasesInstance();
  if (!instance) return;
  const { db, config } = instance;
  const data = {
    history_list: JSON.stringify(history),
    updated_at: new Date().toISOString()
  };

  try {
    await db.updateDocument(config.databaseId, config.historyCollection, userId, data);
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('Document not found')) {
      try {
        await db.createDocument(config.databaseId, config.historyCollection, userId, data);
      } catch (createErr: any) {
        console.warn('Appwrite createDocument history failed:', createErr.message);
        throw createErr;
      }
    } else {
      const enriched = enrichError(error);
      console.warn('Error saving history in Appwrite:', enriched.message);
      throw enriched;
    }
  }
}

// 2. Load all structures from Cloud
export async function loadUserDataFromAppwrite(userId: string): Promise<{
  profile: UserProfile | null;
  habits: Habit[] | null;
  history: DayProgress[] | null;
} | null> {
  const instance = getDatabasesInstance();
  if (!instance) return null;
  const { db, config } = instance;
  try {
    const [profileDoc, habitsDoc, historyDoc] = await Promise.allSettled([
      db.getDocument(config.databaseId, config.profileCollection, userId),
      db.getDocument(config.databaseId, config.habitsCollection, userId),
      db.getDocument(config.databaseId, config.historyCollection, userId)
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

export async function listAllProfilesFromAppwrite(): Promise<Array<{ userId: string; name: string; level: number; xp: number; streak: number; lastActiveDate: string }> | null> {
  const instance = getDatabasesInstance();
  if (!instance) return null;
  const { db, config } = instance;
  try {
    const list = await db.listDocuments(config.databaseId, config.profileCollection);
    return list.documents.map((doc: any) => ({
      userId: doc.$id,
      name: doc.name || 'Praticante Anônimo',
      level: doc.level || 1,
      xp: doc.xp || 0,
      streak: doc.streak || 0,
      lastActiveDate: doc.lastActiveDate || ''
    }));
  } catch (err) {
    console.warn('Failed to list Appwrite profiles:', err);
    return null;
  }
}
