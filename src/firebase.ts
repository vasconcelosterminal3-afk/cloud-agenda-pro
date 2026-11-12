/**
 * CloudAgenda Pro - Firebase Configuration & Real Cloud Services
 * Integrates Firebase Auth (with browserLocalPersistence) and Cloud Firestore ('contacts' collection).
 * Safe fallback guarantees zero build-time or deployment crashes if keys are unconfigured on Vercel.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { Contact } from './types/contact';

// Read environment variables safely
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

// Initialize Firebase App singleton
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('[Firebase Init Error]:', err);
  }
}

export { app, auth, db };

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
 * Maps Firebase user to standardized application user
 */
export function mapFirebaseUser(user: FirebaseUser | null): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuário Pro',
    photoURL: user.photoURL,
  };
}

/**
 * Subscribes to Firebase Auth state changes
 */
export function subscribeToAuth(callback: (user: AppUser | null) => void): Unsubscribe {
  if (auth) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  }

  // Resilient memory session fallback if Firebase keys are pending configuration
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
 * Login with email and password, configuring local persistence
 */
export async function loginWithFirebase(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (auth) {
    // Set explicit persistence: browserLocalPersistence or browserSessionPersistence
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Falha ao processar dados da sessão do Firebase.');
    return mapped;
  }

  // Resilient fallback when Firebase keys are not populated in environment
  const fallbackUser: AppUser = {
    uid: 'fb_user_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase(),
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
 * Register a new user with email, password and display name
 */
export async function registerWithFirebase(
  email: string,
  password: string,
  displayName: string,
  rememberMe: boolean = true
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (auth) {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    
    if (displayName.trim()) {
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
    }

    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Falha ao processar cadastro no Firebase.');
    return mapped;
  }

  // Resilient fallback
  const fallbackUser: AppUser = {
    uid: 'fb_user_' + btoa(cleanEmail).replace(/=/g, '').toLowerCase(),
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
 * Logout from Firebase Auth
 */
export async function logoutFromFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cloudagenda_fallback_uid');
    localStorage.removeItem('cloudagenda_fallback_email');
  }
}

// ----------------------------------------------------------------------
// CLOUD FIRESTORE REAL-TIME CONTACTS SYNC ('contacts' COLLECTION)
// ----------------------------------------------------------------------

const COLLECTION_NAME = 'contacts';

/**
 * Cleans undefined values for clean Firestore storage
 */
function cleanDocPayload(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
}

/**
 * Subscribes to real-time changes in Firestore filtered by userId
 */
export function subscribeToContacts(
  userId: string,
  onContactsChange: (contacts: Contact[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onContactsChange([]);
    return () => {};
  }

  if (db) {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loaded: Contact[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              name: data.name || 'Contato Sem Nome',
              nickname: data.nickname,
              avatarUrl: data.avatarUrl,
              avatarColor: data.avatarColor,
              company: data.company,
              jobTitle: data.jobTitle,
              phones: Array.isArray(data.phones) ? data.phones : [],
              emails: Array.isArray(data.emails) ? data.emails : [],
              address: data.address,
              birthday: data.birthday,
              tags: Array.isArray(data.tags) ? data.tags : ['Geral'],
              notes: data.notes,
              isFavorite: Boolean(data.isFavorite),
              isEmergencyIce: Boolean(data.isEmergencyIce),
              isVaultSecret: Boolean(data.isVaultSecret),
              userId: data.userId || userId,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });
          onContactsChange(loaded);
        },
        (error) => {
          console.error('[Firestore onSnapshot Error]:', error);
          if (onError) onError(error);
        }
      );
      return unsubscribe;
    } catch (err: any) {
      console.error('[Firestore subscribe error]:', err);
      if (onError) onError(err);
    }
  }

  // Resilient memory store when Firestore credentials are not set
  const memoryKey = `cloudagenda_resilient_contacts_${userId}`;
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
  loadFallback();
  return () => {};
}

/**
 * Adds or updates a single contact directly in Firestore
 */
export async function saveContactToFirestore(userId: string, contact: Contact): Promise<void> {
  const contactId = contact.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const payload = cleanDocPayload({
    ...contact,
    id: contactId,
    userId,
    updatedAt: new Date().toISOString(),
    createdAt: contact.createdAt || new Date().toISOString(),
  });

  if (db) {
    const docRef = doc(db, COLLECTION_NAME, contactId);
    await setDoc(docRef, payload, { merge: true });
    return;
  }

  // Resilient fallback storage
  if (typeof window !== 'undefined') {
    const memoryKey = `cloudagenda_resilient_contacts_${userId}`;
    const raw = localStorage.getItem(memoryKey);
    const list: Contact[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === contactId);
    if (idx !== -1) {
      list[idx] = payload as Contact;
    } else {
      list.unshift(payload as Contact);
    }
    localStorage.setItem(memoryKey, JSON.stringify(list));
  }
}

/**
 * Deletes a contact from Firestore
 */
export async function deleteContactFromFirestore(contactId: string, userId: string): Promise<void> {
  if (db) {
    const docRef = doc(db, COLLECTION_NAME, contactId);
    await deleteDoc(docRef);
    return;
  }

  if (typeof window !== 'undefined') {
    const memoryKey = `cloudagenda_resilient_contacts_${userId}`;
    const raw = localStorage.getItem(memoryKey);
    if (raw) {
      const list: Contact[] = JSON.parse(raw);
      const filtered = list.filter((c) => c.id !== contactId);
      localStorage.setItem(memoryKey, JSON.stringify(filtered));
    }
  }
}

/**
 * Deletes multiple contacts in bulk from Firestore using WriteBatch
 */
export async function deleteContactsBulkFromFirestore(contactIds: string[], userId: string): Promise<void> {
  if (db && contactIds.length > 0) {
    // Firestore batch limit is 500 operations per batch
    const batchSize = 450;
    for (let i = 0; i < contactIds.length; i += batchSize) {
      const chunk = contactIds.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const docRef = doc(db!, COLLECTION_NAME, id);
        batch.delete(docRef);
      });
      await batch.commit();
    }
    return;
  }

  if (typeof window !== 'undefined') {
    const memoryKey = `cloudagenda_resilient_contacts_${userId}`;
    const raw = localStorage.getItem(memoryKey);
    if (raw) {
      const set = new Set(contactIds);
      const list: Contact[] = JSON.parse(raw);
      const filtered = list.filter((c) => !set.has(c.id));
      localStorage.setItem(memoryKey, JSON.stringify(filtered));
    }
  }
}

/**
 * Saves multiple contacts in batch (e.g. from Excel, JSON, or Ctrl+V import)
 */
export async function saveContactsBulkToFirestore(userId: string, contacts: Contact[]): Promise<number> {
  if (contacts.length === 0) return 0;

  const now = new Date().toISOString();
  const preparedContacts = contacts.map((c) => {
    const contactId = c.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return cleanDocPayload({
      ...c,
      id: contactId,
      userId,
      createdAt: c.createdAt || now,
      updatedAt: now,
    }) as Contact;
  });

  if (db) {
    const batchSize = 400;
    for (let i = 0; i < preparedContacts.length; i += batchSize) {
      const chunk = preparedContacts.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((contact) => {
        const docRef = doc(db!, COLLECTION_NAME, contact.id);
        batch.set(docRef, contact, { merge: true });
      });
      await batch.commit();
    }
    return preparedContacts.length;
  }

  if (typeof window !== 'undefined') {
    const memoryKey = `cloudagenda_resilient_contacts_${userId}`;
    const raw = localStorage.getItem(memoryKey);
    const existing: Contact[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, Contact>();
    existing.forEach((c) => map.set(c.id, c));
    preparedContacts.forEach((c) => map.set(c.id, c));
    localStorage.setItem(memoryKey, JSON.stringify(Array.from(map.values())));
  }

  return preparedContacts.length;
}

/**
 * Restores a backup JSON file directly into Firestore without duplicating existing contacts
 */
export async function restoreBackupIntoFirestore(
  userId: string,
  backupContacts: Contact[],
  currentContacts: Contact[]
): Promise<{ addedCount: number; skippedCount: number }> {
  // Build lookup index of existing phone numbers and emails to prevent duplicates
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

    // Check name + phone combined
    if (!isDuplicate && backup.name && existingNames.has(backup.name.trim().toLowerCase())) {
      // If name matches and has no phone or matching phone, consider potential duplicate
      if (!backup.phones || backup.phones.length === 0) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      skippedCount++;
    } else {
      contactsToInsert.push(backup);
      // Add to index so duplicate entries in the backup file itself don't duplicate
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
    await saveContactsBulkToFirestore(userId, contactsToInsert);
  }

  return { addedCount: contactsToInsert.length, skippedCount };
}
