import { Contact, CloudBackupSnapshot, SyncedDevice } from '../types/contact';
import { INITIAL_CONTACTS, INITIAL_SNAPSHOTS, INITIAL_DEVICES } from '../data/seedContacts';

const STORAGE_KEYS = {
  CONTACTS: 'cloudagenda_contacts_v1',
  SNAPSHOTS: 'cloudagenda_snapshots_v1',
  DEVICES: 'cloudagenda_devices_v1',
  TRASH: 'cloudagenda_trash_v1',
  VAULT_PIN: 'cloudagenda_vault_pin_v1',
  VAULT_UNLOCKED: 'cloudagenda_vault_unlocked_v1',
  AUTO_SYNC_INTERVAL: 'cloudagenda_auto_sync_interval_v1',
  LAST_SYNC_TIME: 'cloudagenda_last_sync_time_v1',
  CLOUD_STORAGE_CAPACITY: 'cloudagenda_storage_capacity_v1', // 50 GB
};

export interface TrashItem {
  contact: Contact;
  deletedAt: string;
  autoPurgeDays?: number;
}

export interface SnapshotDiff {
  added: Contact[];
  removed: Contact[];
  modified: { current: Contact; snapshot: Contact }[];
  unchanged: Contact[];
}

export function getSavedContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) {
      saveContacts(INITIAL_CONTACTS);
      return INITIAL_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONTACTS;
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());
  } catch (err) {
    console.error('Failed to save contacts', err);
  }
}

export function getSavedSnapshots(): CloudBackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (!raw) {
      saveSnapshots(INITIAL_SNAPSHOTS);
      return INITIAL_SNAPSHOTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SNAPSHOTS;
  }
}

export function saveSnapshots(snapshots: CloudBackupSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
  } catch (err) {
    console.error('Failed to save snapshots', err);
  }
}

export function getSavedDevices(): SyncedDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVICES);
    if (!raw) {
      saveDevices(INITIAL_DEVICES);
      return INITIAL_DEVICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEVICES;
  }
}

export function saveDevices(devices: SyncedDevice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  } catch (err) {
    console.error('Failed to save devices', err);
  }
}

export function getTrash(): TrashItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRASH);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrash(items: TrashItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save trash', err);
  }
}

export function moveToTrash(contact: Contact): void {
  const currentContacts = getSavedContacts();
  const updatedContacts = currentContacts.filter((c) => c.id !== contact.id);
  saveContacts(updatedContacts);

  const trash = getTrash();
  trash.unshift({
    contact,
    deletedAt: new Date().toISOString(),
  });
  saveTrash(trash);
}

export function restoreFromTrash(contactId: string): Contact | null {
  const trash = getTrash();
  const itemIndex = trash.findIndex((i) => i.contact.id === contactId);
  if (itemIndex === -1) return null;

  const [item] = trash.splice(itemIndex, 1);
  saveTrash(trash);

  const currentContacts = getSavedContacts();
  currentContacts.push(item.contact);
  saveContacts(currentContacts);

  return item.contact;
}

export function emptyTrash(): void {
  saveTrash([]);
}

export function getVaultPin(): string {
  return localStorage.getItem(STORAGE_KEYS.VAULT_PIN) || '1234';
}

export function setVaultPin(pin: string): void {
  localStorage.setItem(STORAGE_KEYS.VAULT_PIN, pin);
}

export function createCloudSnapshot(
  contacts: Contact[],
  label: string,
  deviceOrigin: string = 'Web Cloud Sync'
): CloudBackupSnapshot {
  const jsonStr = JSON.stringify(contacts);
  const sizeBytes = new Blob([jsonStr]).size;
  const hashHex = Array.from(new Uint8Array(32))
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

  const newSnapshot: CloudBackupSnapshot = {
    id: `snap_${Date.now()}`,
    label: label.trim() || `Backup Nuvem ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    createdAt: new Date().toISOString(),
    contactCount: contacts.length,
    sizeBytes,
    deviceOrigin,
    checksum: `sha256:${hashHex}`,
    contacts: JSON.parse(jsonStr),
    isAutomatic: false,
  };

  const existing = getSavedSnapshots();
  const updated = [newSnapshot, ...existing];
  saveSnapshots(updated);
  return newSnapshot;
}

export function deleteCloudSnapshot(id: string): void {
  const existing = getSavedSnapshots();
  const updated = existing.filter((s) => s.id !== id);
  saveSnapshots(updated);
}

/**
 * Computes difference between current contact book and a snapshot
 */
export function computeSnapshotDiff(currentContacts: Contact[], snapshot: CloudBackupSnapshot): SnapshotDiff {
  const snapMap = new Map(snapshot.contacts.map((c) => [c.id, c]));
  const currentMap = new Map(currentContacts.map((c) => [c.id, c]));

  const added: Contact[] = [];
  const modified: { current: Contact; snapshot: Contact }[] = [];
  const unchanged: Contact[] = [];

  currentContacts.forEach((cur) => {
    const snap = snapMap.get(cur.id);
    if (!snap) {
      added.push(cur);
    } else {
      const curStr = JSON.stringify({ ...cur, updatedAt: '' });
      const snapStr = JSON.stringify({ ...snap, updatedAt: '' });
      if (curStr !== snapStr) {
        modified.push({ current: cur, snapshot: snap });
      } else {
        unchanged.push(cur);
      }
    }
  });

  const removed: Contact[] = [];
  snapshot.contacts.forEach((snap) => {
    if (!currentMap.has(snap.id)) {
      removed.push(snap);
    }
  });

  return { added, removed, modified, unchanged };
}

export function resetToDemo(): void {
  saveContacts(INITIAL_CONTACTS);
  saveSnapshots(INITIAL_SNAPSHOTS);
  saveDevices(INITIAL_DEVICES);
  saveTrash([]);
}
