/**
 * CloudAgenda Pro - Supabase Client & Real Cloud Services
 * Integrates Supabase Auth (with persistent session storage) and PostgreSQL ('contacts' table).
 * Safe fallback guarantees zero build-time, Vercel, or preview crashes if keys are unconfigured.
 */

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { Contact } from './types/contact';

// Read environment variables safely
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

export const supabaseUrl = env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  !supabaseUrl.includes('placeholder')
);

// Initialize Supabase client singleton with persistent session
let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  } catch (err) {
    console.error('[Supabase Init Error]:', err);
  }
}

export { supabase };

// ----------------------------------------------------------------------
// USER AUTHENTICATION API
// ----------------------------------------------------------------------

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
}

/**
 * Maps Supabase User to standardized application user
 */
export function mapSupabaseUser(user: SupabaseUser | null): AppUser | null {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    uid: user.id,
    email: user.email || '',
    displayName: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Usuário Pro',
    photoURL: metadata.avatar_url || null,
  };
}

/**
 * Subscribes to Supabase Auth state changes with session persistence
 */
export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  if (supabase) {
    // 1. Initial active session check from persistent storage
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[Supabase getSession Warning]:', error.message);
      }
      if (session?.user) {
        callback(mapSupabaseUser(session.user));
      } else {
        // If not in Supabase yet, check fallback
        const localUid = typeof window !== 'undefined' ? localStorage.getItem('cloudagenda_fallback_uid') : null;
        const localEmail = typeof window !== 'undefined' ? localStorage.getItem('cloudagenda_fallback_email') : null;
        if (localUid && localEmail) {
          callback({
            uid: localUid,
            email: localEmail,
            displayName: localEmail.split('@')[0],
          });
        } else {
          callback(null);
        }
      }
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(mapSupabaseUser(session.user));
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  // Resilient memory session fallback if Supabase keys are not populated yet
  const localUid = typeof window !== 'undefined' ? localStorage.getItem('cloudagenda_fallback_uid') : null;
  const localEmail = typeof window !== 'undefined' ? localStorage.getItem('cloudagenda_fallback_email') : null;
  if (localUid && localEmail) {
    callback({
      uid: localUid,
      email: localEmail,
      displayName: localEmail.split('@')[0],
    });
  } else {
    callback(null);
  }
  return () => {};
}

/**
 * Login with email and password via Supabase Auth
 */
export async function loginWithSupabase(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Falha ao autenticar sessão no Supabase.');
    }

    // If rememberMe is explicitly false, clean on browser close
    if (!rememberMe && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        supabase?.auth.signOut();
      }, { once: true });
    }

    const mapped = mapSupabaseUser(data.user);
    if (!mapped) throw new Error('Não foi possível obter dados do usuário.');
    return mapped;
  }

  // Resilient fallback when Supabase keys are not populated in environment
  const fallbackUser: AppUser = {
    uid: 'sb_user_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase(),
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0],
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('cloudagenda_fallback_uid', fallbackUser.uid);
    localStorage.setItem('cloudagenda_fallback_email', fallbackUser.email);
  }
  return fallbackUser;
}

/**
 * Register a new user with email, password, and display name via Supabase Auth
 */
export async function registerWithSupabase(
  email: string,
  password: string,
  displayName: string,
  rememberMe: boolean = true
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: displayName.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Falha ao registrar conta no Supabase.');
    }

    const mapped = mapSupabaseUser(data.user);
    if (!mapped) throw new Error('Não foi possível registrar o usuário.');
    return mapped;
  }

  // Resilient fallback
  const fallbackUser: AppUser = {
    uid: 'sb_user_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase(),
    email: cleanEmail,
    displayName: displayName.trim() || cleanEmail.split('@')[0],
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('cloudagenda_fallback_uid', fallbackUser.uid);
    localStorage.setItem('cloudagenda_fallback_email', fallbackUser.email);
  }
  return fallbackUser;
}

/**
 * Logout from Supabase Auth
 */
export async function logoutFromSupabase(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cloudagenda_fallback_uid');
    localStorage.removeItem('cloudagenda_fallback_email');
  }
}

// ----------------------------------------------------------------------
// SUPABASE REAL-TIME DATABASE SYNC ('contacts' TABLE)
// ----------------------------------------------------------------------

const TABLE_NAME = 'contacts';

/**
 * Converts a Contact object into Supabase database row format
 */
function contactToRow(userId: string, contact: Contact): Record<string, any> {
  const contactId = contact.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  return {
    id: contactId,
    user_id: userId,
    name: contact.name || 'Contato Sem Nome',
    nickname: contact.nickname || null,
    avatar_url: contact.avatarUrl || null,
    avatar_color: contact.avatarColor || null,
    company: contact.company || null,
    job_title: contact.jobTitle || null,
    phones: contact.phones || [],
    emails: contact.emails || [],
    address: contact.address || null,
    birthday: contact.birthday || null,
    tags: contact.tags || ['Geral'],
    notes: contact.notes || null,
    is_favorite: Boolean(contact.isFavorite),
    is_emergency_ice: Boolean(contact.isEmergencyIce),
    is_vault_secret: Boolean(contact.isVaultSecret),
    payload: {
      ...contact,
      id: contactId,
      userId,
    },
    created_at: contact.createdAt || now,
    updated_at: now,
  };
}

/**
 * Maps a database row into standard Contact interface
 */
function rowToContact(row: any, defaultUserId: string): Contact {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};

  return {
    id: String(row.id || payload.id),
    name: row.name || payload.name || 'Contato Sem Nome',
    nickname: row.nickname || payload.nickname,
    avatarUrl: row.avatar_url || row.avatarUrl || payload.avatarUrl,
    avatarColor: row.avatar_color || row.avatarColor || payload.avatarColor,
    company: row.company || payload.company,
    jobTitle: row.job_title || row.jobTitle || payload.jobTitle,
    phones: Array.isArray(row.phones) ? row.phones : (Array.isArray(payload.phones) ? payload.phones : []),
    emails: Array.isArray(row.emails) ? row.emails : (Array.isArray(payload.emails) ? payload.emails : []),
    address: row.address || payload.address,
    birthday: row.birthday || payload.birthday,
    tags: Array.isArray(row.tags) ? row.tags : (Array.isArray(payload.tags) ? payload.tags : ['Geral']),
    notes: row.notes || payload.notes,
    isFavorite: Boolean(row.is_favorite ?? row.isFavorite ?? payload.isFavorite),
    isEmergencyIce: Boolean(row.is_emergency_ice ?? row.isEmergencyIce ?? payload.isEmergencyIce),
    isVaultSecret: Boolean(row.is_vault_secret ?? row.isVaultSecret ?? payload.isVaultSecret),
    userId: row.user_id || row.userId || payload.userId || defaultUserId,
    createdAt: row.created_at || row.createdAt || payload.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || payload.updatedAt || new Date().toISOString(),
  };
}

/**
 * Subscribes to real-time changes in Supabase 'contacts' table filtered by user_id
 */
export function subscribeToContacts(
  userId: string,
  onContactsChange: (contacts: Contact[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onContactsChange([]);
    return () => {};
  }

  // Load from resilient cache first
  const memoryKey = `cloudagenda_supabase_contacts_${userId}`;
  const loadFallback = () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(memoryKey) : null;
      if (raw) {
        onContactsChange(JSON.parse(raw));
      } else {
        onContactsChange([]);
      }
    } catch {
      onContactsChange([]);
    }
  };

  if (!supabase) {
    loadFallback();
    return () => {};
  }

  let isSubscribed = true;

  // Function to fetch latest contacts from Supabase 'contacts' table
  const fetchContacts = async () => {
    if (!supabase || !isSubscribed) return;
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        console.warn('[Supabase contacts query warning]:', error.message);
        loadFallback();
        if (onError) onError(new Error(error.message));
        return;
      }

      if (data && isSubscribed) {
        const loaded = data.map((r) => rowToContact(r, userId));
        onContactsChange(loaded);
        if (typeof window !== 'undefined') {
          localStorage.setItem(memoryKey, JSON.stringify(loaded));
        }
      }
    } catch (err: any) {
      console.error('[Supabase fetchContacts error]:', err);
      loadFallback();
      if (onError) onError(err);
    }
  };

  // Initial fetch
  fetchContacts();

  // Supabase Realtime channel subscription
  let channel: any = null;
  try {
    channel = supabase
      .channel(`realtime:contacts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE_NAME,
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();
  } catch (chanErr) {
    console.warn('[Supabase Realtime Channel Init Error]:', chanErr);
  }

  return () => {
    isSubscribed = false;
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Adds or updates a single contact in Supabase 'contacts' table
 */
export async function saveContactToSupabase(userId: string, contact: Contact): Promise<void> {
  const row = contactToRow(userId, contact);
  const contactId = row.id;

  // Update memory cache immediately for instantaneous UI response
  const memoryKey = `cloudagenda_supabase_contacts_${userId}`;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(memoryKey);
    const list: Contact[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === contactId);
    const updatedContact: Contact = {
      ...contact,
      id: contactId,
      userId,
      updatedAt: row.updated_at,
    };
    if (idx !== -1) {
      list[idx] = updatedContact;
    } else {
      list.unshift(updatedContact);
    }
    localStorage.setItem(memoryKey, JSON.stringify(list));
  }

  if (supabase) {
    try {
      const { error } = await supabase.from(TABLE_NAME).upsert(row, { onConflict: 'id' });
      if (error) {
        // If specific columns are missing in user's table, retry with minimal schema
        console.warn('[Supabase upsert warning, retrying with minimal schema]:', error.message);
        const minimalRow = {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          payload: row.payload,
          updated_at: row.updated_at,
        };
        const retryRes = await supabase.from(TABLE_NAME).upsert(minimalRow, { onConflict: 'id' });
        if (retryRes.error) {
          throw retryRes.error;
        }
      }
    } catch (err) {
      console.error('[Supabase saveContact error]:', err);
      throw err;
    }
  }
}

/**
 * Deletes a contact from Supabase 'contacts' table
 */
export async function deleteContactFromSupabase(contactId: string, userId: string): Promise<void> {
  if (!contactId || typeof contactId !== 'string') return;
  const cleanId = contactId.trim();
  if (!cleanId) return;

  // Update memory cache immediately
  const memoryKey = `cloudagenda_supabase_contacts_${userId}`;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(memoryKey);
    if (raw) {
      const list: Contact[] = JSON.parse(raw);
      const filtered = list.filter((c) => c.id !== cleanId);
      localStorage.setItem(memoryKey, JSON.stringify(filtered));
    }
  }

  if (supabase) {
    try {
      let { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', cleanId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[Supabase delete retry without eq user_id]:', error.message);
        const retry = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', cleanId);
        error = retry.error;
      }

      // If schema has deleted_at soft-delete
      if (error && (error.message.includes('deleted_at') || error.code === '42703')) {
        await supabase
          .from(TABLE_NAME)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', cleanId);
      }
    } catch (err) {
      console.error('[Supabase deleteContact warning]:', err);
    }
  }
}

/**
 * Deletes multiple contacts in bulk from Supabase 'contacts' table
 */
export async function deleteContactsBulkFromSupabase(contactIds: string[], userId: string): Promise<void> {
  const validIds = contactIds
    .filter((id) => Boolean(id && typeof id === 'string' && id.trim().length > 0))
    .map((id) => id.trim());

  if (validIds.length === 0) return;

  // Update memory cache immediately
  const memoryKey = `cloudagenda_supabase_contacts_${userId}`;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(memoryKey);
    if (raw) {
      const set = new Set(validIds);
      const list: Contact[] = JSON.parse(raw);
      const filtered = list.filter((c) => !set.has(c.id));
      localStorage.setItem(memoryKey, JSON.stringify(filtered));
    }
  }

  if (supabase) {
    try {
      // Primary: Hard delete matching IDs and user_id
      let { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .in('id', validIds)
        .eq('user_id', userId);

      // If user_id column constraint or RLS caused error, retry by ID
      if (error) {
        console.warn('[Supabase bulk delete retry without eq user_id]:', error.message);
        const retry = await supabase
          .from(TABLE_NAME)
          .delete()
          .in('id', validIds);
        error = retry.error;
      }

      // If table is configured with soft-delete 'deleted_at'
      if (error && (error.message.includes('deleted_at') || error.code === '42703')) {
        console.warn('[Supabase bulk soft-delete fallback]:', error.message);
        await supabase
          .from(TABLE_NAME)
          .update({ deleted_at: new Date().toISOString() })
          .in('id', validIds);
      }
    } catch (err: any) {
      console.error('[Supabase bulk delete caught warning]:', err);
    }
  }
}

/**
 * Saves multiple contacts in bulk to Supabase (e.g. from Excel, JSON, or Ctrl+V import)
 */
export async function saveContactsBulkToSupabase(userId: string, contacts: Contact[]): Promise<number> {
  if (contacts.length === 0) return 0;

  const rows = contacts.map((c) => contactToRow(userId, c));

  // Update memory cache
  const memoryKey = `cloudagenda_supabase_contacts_${userId}`;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(memoryKey);
    const existing: Contact[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, Contact>();
    existing.forEach((c) => map.set(c.id, c));
    contacts.forEach((c) => {
      const contactId = c.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      map.set(contactId, { ...c, id: contactId, userId });
    });
    localStorage.setItem(memoryKey, JSON.stringify(Array.from(map.values())));
  }

  if (supabase) {
    // Batch in chunks of 200 rows for high throughput
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from(TABLE_NAME).upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn('[Supabase bulk upsert warning, retrying with minimal payload]:', error.message);
        const minimalChunk = chunk.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          name: r.name,
          payload: r.payload,
          updated_at: r.updated_at,
        }));
        const retryRes = await supabase.from(TABLE_NAME).upsert(minimalChunk, { onConflict: 'id' });
        if (retryRes.error) {
          throw retryRes.error;
        }
      }
    }
  }

  return rows.length;
}

/**
 * Restores a backup JSON file directly into Supabase without duplicating existing contacts
 */
export async function restoreBackupIntoSupabase(
  userId: string,
  backupContacts: Contact[],
  currentContacts: Contact[]
): Promise<{ addedCount: number; skippedCount: number }> {
  // Build lookup index of existing phone numbers, emails, and names to prevent duplicates
  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();
  const existingNames = new Set<string>();

  currentContacts.forEach((c) => {
    c.phones?.forEach((p) => {
      const digits = p.number.replace(/\D/g, '');
      if (digits) existingPhones.add(digits);
    });
    c.emails?.forEach((e) => {
      if (e.email) existingEmails.add(e.email.trim().toLowerCase());
    });
    if (c.name) existingNames.add(c.name.trim().toLowerCase());
  });

  const contactsToInsert: Contact[] = [];
  let skippedCount = 0;

  backupContacts.forEach((backup) => {
    let isDuplicate = false;

    // Check phone match
    if (backup.phones && backup.phones.length > 0) {
      for (const p of backup.phones) {
        const digits = p.number.replace(/\D/g, '');
        if (digits && existingPhones.has(digits)) {
          isDuplicate = true;
          break;
        }
      }
    }

    // Check email match
    if (!isDuplicate && backup.emails && backup.emails.length > 0) {
      for (const e of backup.emails) {
        const cleanEmail = e.email.trim().toLowerCase();
        if (cleanEmail && existingEmails.has(cleanEmail)) {
          isDuplicate = true;
          break;
        }
      }
    }

    // Check name match
    if (!isDuplicate && backup.name && existingNames.has(backup.name.trim().toLowerCase())) {
      if (!backup.phones || backup.phones.length === 0) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      skippedCount++;
    } else {
      contactsToInsert.push(backup);
      backup.phones?.forEach((p) => {
        const d = p.number.replace(/\D/g, '');
        if (d) existingPhones.add(d);
      });
      backup.emails?.forEach((e) => {
        if (e.email) existingEmails.add(e.email.trim().toLowerCase());
      });
    }
  });

  if (contactsToInsert.length > 0) {
    await saveContactsBulkToSupabase(userId, contactsToInsert);
  }

  return { addedCount: contactsToInsert.length, skippedCount };
}
