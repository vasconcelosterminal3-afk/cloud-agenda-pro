import { Contact, CloudBackupSnapshot, SyncedDevice } from '../types/contact';

// Empty initial contacts list - newly created accounts start completely clean with 0 contacts
export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_SNAPSHOTS: CloudBackupSnapshot[] = [];

export const INITIAL_DEVICES: SyncedDevice[] = [
  {
    id: 'dev-1',
    name: 'Dispositivo Principal',
    model: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mac') ? 'Apple MacBook Pro' : 'Navegador Web Pro') : 'Navegador Web',
    platform: 'web',
    lastSyncAt: 'Agora mesmo (Tempo Real)',
    status: 'active',
    clientVersion: 'v4.5.0',
    ipLocation: 'Conexão Segura',
  },
];
