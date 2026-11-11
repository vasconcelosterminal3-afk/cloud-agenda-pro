export type PhoneType = 'mobile' | 'whatsapp' | 'work' | 'home' | 'main' | 'other';
export type EmailType = 'personal' | 'work' | 'other';
export type AddressType = 'home' | 'work' | 'other';

export interface PhoneNumber {
  id: string;
  type: PhoneType;
  number: string;
  isPrimary?: boolean;
}

export interface EmailAddress {
  id: string;
  type: EmailType;
  email: string;
  isPrimary?: boolean;
}

export interface PostalAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  avatarColor?: string;
  company?: string;
  jobTitle?: string;
  phones: PhoneNumber[];
  emails: EmailAddress[];
  address?: PostalAddress;
  birthday?: string; // YYYY-MM-DD
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isEmergencyIce: boolean; // In Case of Emergency
  isVaultSecret?: boolean; // Hidden behind PIN vault
  createdAt: string;
  updatedAt: string;
}

export interface CloudBackupSnapshot {
  id: string;
  label: string;
  createdAt: string;
  contactCount: number;
  sizeBytes: number;
  deviceOrigin: string;
  checksum: string;
  contacts: Contact[];
  isAutomatic?: boolean;
}

export interface SyncedDevice {
  id: string;
  name: string;
  model: string;
  platform: 'ios' | 'android' | 'macos' | 'windows' | 'web';
  lastSyncAt: string;
  status: 'active' | 'syncing' | 'idle';
  clientVersion: string;
  ipLocation: string;
}

export interface DuplicateGroup {
  id: string;
  reason: 'phone' | 'email' | 'name';
  matchedValue: string;
  contactIds: string[];
}

export interface HealthIssue {
  type: 'no_phone' | 'no_name' | 'invalid_phone' | 'duplicate';
  message: string;
  contactId: string;
  contactName: string;
}
