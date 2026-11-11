import { Contact, DuplicateGroup, HealthIssue, PhoneNumber, EmailAddress } from '../types/contact';
import { cleanDigits } from './phoneFormatter';

/**
 * Normalizes text removing accents and extra spaces for fuzzy matching
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Scans list of contacts to detect duplicate pairs and clusters
 */
export function scanDuplicates(contacts: Contact[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processedPhonePairs = new Set<string>();
  const processedEmailPairs = new Set<string>();
  const processedNamePairs = new Set<string>();

  // 1. Phone match
  const phoneMap = new Map<string, string[]>();
  contacts.forEach((contact) => {
    contact.phones.forEach((p) => {
      let digits = cleanDigits(p.number);
      if (digits.length >= 8) {
        // Strip country code 55 if present for local comparison
        if (digits.startsWith('55') && digits.length >= 10) {
          digits = digits.slice(2);
        }
        const existing = phoneMap.get(digits) || [];
        if (!existing.includes(contact.id)) {
          existing.push(contact.id);
        }
        phoneMap.set(digits, existing);
      }
    });
  });

  phoneMap.forEach((ids, digits) => {
    if (ids.length > 1) {
      const key = [...ids].sort().join('-');
      if (!processedPhonePairs.has(key)) {
        processedPhonePairs.add(key);
        groups.push({
          id: `dup_ph_${digits}_${Date.now()}`,
          reason: 'phone',
          matchedValue: `Telefone compartilhado: ${digits}`,
          contactIds: ids,
        });
      }
    }
  });

  // 2. Email match
  const emailMap = new Map<string, string[]>();
  contacts.forEach((contact) => {
    contact.emails.forEach((e) => {
      const em = e.email.toLowerCase().trim();
      if (em.length > 4 && em.includes('@')) {
        const existing = emailMap.get(em) || [];
        if (!existing.includes(contact.id)) {
          existing.push(contact.id);
        }
        emailMap.set(em, existing);
      }
    });
  });

  emailMap.forEach((ids, em) => {
    if (ids.length > 1) {
      const key = [...ids].sort().join('-');
      if (!processedEmailPairs.has(key)) {
        processedEmailPairs.add(key);
        // Only add if not already clustered under phone
        const existingGroup = groups.find((g) => g.contactIds.join(',') === ids.join(','));
        if (!existingGroup) {
          groups.push({
            id: `dup_em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            reason: 'email',
            matchedValue: `E-mail em comum: ${em}`,
            contactIds: ids,
          });
        }
      }
    }
  });

  // 3. Exact Normalized Name match
  const nameMap = new Map<string, string[]>();
  contacts.forEach((contact) => {
    const norm = normalizeName(contact.name);
    if (norm.length > 2) {
      const existing = nameMap.get(norm) || [];
      if (!existing.includes(contact.id)) {
        existing.push(contact.id);
      }
      nameMap.set(norm, existing);
    }
  });

  nameMap.forEach((ids, normName) => {
    if (ids.length > 1) {
      const key = [...ids].sort().join('-');
      if (!processedNamePairs.has(key)) {
        processedNamePairs.add(key);
        const existingGroup = groups.find((g) => g.contactIds.join(',') === ids.join(','));
        if (!existingGroup) {
          groups.push({
            id: `dup_nm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            reason: 'name',
            matchedValue: `Mesmo nome: "${normName}"`,
            contactIds: ids,
          });
        }
      }
    }
  });

  return groups;
}

/**
 * Merges multiple contacts into a single clean, rich contact
 */
export function smartMergeContacts(contactsToMerge: Contact[]): Contact {
  if (contactsToMerge.length === 0) {
    throw new Error('No contacts to merge');
  }
  if (contactsToMerge.length === 1) {
    return contactsToMerge[0];
  }

  // Base is the contact with the most information
  const sorted = [...contactsToMerge].sort((a, b) => {
    const scoreA = (a.avatarUrl ? 3 : 0) + a.phones.length * 2 + a.emails.length * 2 + (a.notes ? 1 : 0) + (a.company ? 1 : 0);
    const scoreB = (b.avatarUrl ? 3 : 0) + b.phones.length * 2 + b.emails.length * 2 + (b.notes ? 1 : 0) + (b.company ? 1 : 0);
    return scoreB - scoreA;
  });

  const primary = sorted[0];

  // Merge phones without duplicate digits
  const mergedPhones: PhoneNumber[] = [];
  const seenDigits = new Set<string>();

  contactsToMerge.forEach((c) => {
    c.phones.forEach((p) => {
      const dig = cleanDigits(p.number);
      if (dig && !seenDigits.has(dig)) {
        seenDigits.add(dig);
        mergedPhones.push({
          ...p,
          id: `ph_mrg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          isPrimary: mergedPhones.length === 0,
        });
      }
    });
  });

  // Merge emails without duplicates
  const mergedEmails: EmailAddress[] = [];
  const seenEmails = new Set<string>();

  contactsToMerge.forEach((c) => {
    c.emails.forEach((e) => {
      const em = e.email.trim().toLowerCase();
      if (em && !seenEmails.has(em)) {
        seenEmails.add(em);
        mergedEmails.push({
          ...e,
          id: `em_mrg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          isPrimary: mergedEmails.length === 0,
        });
      }
    });
  });

  // Merge tags
  const tagsSet = new Set<string>();
  contactsToMerge.forEach((c) => c.tags.forEach((t) => tagsSet.add(t)));
  tagsSet.add('Mesclado');

  // Merge notes
  const notesList = contactsToMerge
    .map((c) => c.notes?.trim())
    .filter(Boolean) as string[];
  const uniqueNotes = Array.from(new Set(notesList)).join('\n---\n');

  // Best address
  const address = contactsToMerge.find((c) => c.address && (c.address.street || c.address.city))?.address || primary.address;

  // Best avatar
  const avatarUrl = contactsToMerge.find((c) => c.avatarUrl)?.avatarUrl || primary.avatarUrl;

  // Company and title
  const company = contactsToMerge.find((c) => c.company)?.company || primary.company;
  const jobTitle = contactsToMerge.find((c) => c.jobTitle)?.jobTitle || primary.jobTitle;
  const birthday = contactsToMerge.find((c) => c.birthday)?.birthday || primary.birthday;
  const isFavorite = contactsToMerge.some((c) => c.isFavorite);
  const isEmergencyIce = contactsToMerge.some((c) => c.isEmergencyIce);

  return {
    ...primary,
    company,
    jobTitle,
    avatarUrl,
    phones: mergedPhones,
    emails: mergedEmails,
    address,
    birthday,
    tags: Array.from(tagsSet),
    notes: uniqueNotes,
    isFavorite,
    isEmergencyIce,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Health and completeness analysis of the contact book
 */
export function analyzeContactHealth(contacts: Contact[]): {
  score: number;
  totalContacts: number;
  duplicatesCount: number;
  noPhoneCount: number;
  noEmailCount: number;
  completeProfilesCount: number;
  issues: HealthIssue[];
} {
  const issues: HealthIssue[] = [];
  let noPhoneCount = 0;
  let noEmailCount = 0;
  let completeProfilesCount = 0;

  contacts.forEach((c) => {
    let isComplete = true;

    if (!c.name.trim() || c.name.toLowerCase() === 'contato sem nome') {
      issues.push({
        type: 'no_name',
        message: 'Contato sem nome definido',
        contactId: c.id,
        contactName: c.name,
      });
      isComplete = false;
    }

    if (!c.phones || c.phones.length === 0) {
      noPhoneCount++;
      issues.push({
        type: 'no_phone',
        message: 'Nenhum número de telefone cadastrado',
        contactId: c.id,
        contactName: c.name,
      });
      isComplete = false;
    } else {
      c.phones.forEach((p) => {
        const dig = cleanDigits(p.number);
        if (dig.length < 8) {
          issues.push({
            type: 'invalid_phone',
            message: `Número incompleto ou curto: "${p.number}"`,
            contactId: c.id,
            contactName: c.name,
          });
          isComplete = false;
        }
      });
    }

    if (!c.emails || c.emails.length === 0) {
      noEmailCount++;
    }

    if (isComplete && c.emails.length > 0 && (c.company || c.avatarUrl)) {
      completeProfilesCount++;
    }
  });

  const dupGroups = scanDuplicates(contacts);
  const duplicatesCount = dupGroups.length;

  // Calculate score: starting from 100, penalize issues
  let score = 100;
  if (contacts.length > 0) {
    const penaltyPerDup = Math.min(25, duplicatesCount * 5);
    const penaltyNoPhone = Math.min(30, (noPhoneCount / contacts.length) * 40);
    const penaltyNoName = Math.min(20, issues.filter((i) => i.type === 'no_name').length * 10);
    score = Math.max(20, Math.round(100 - penaltyPerDup - penaltyNoPhone - penaltyNoName));
  }

  return {
    score,
    totalContacts: contacts.length,
    duplicatesCount,
    noPhoneCount,
    noEmailCount,
    completeProfilesCount,
    issues,
  };
}
