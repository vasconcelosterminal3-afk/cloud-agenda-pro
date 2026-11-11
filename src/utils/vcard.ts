import QRCode from 'qrcode';
import { Contact, PhoneNumber, EmailAddress } from '../types/contact';

/**
 * Generates an RFC 2426/6350 compliant vCard 3.0 string for a contact
 */
export function generateVCard(contact: Contact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
  ];

  const nameParts = contact.name.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const firstName = nameParts[0] || '';
  const middleNames = nameParts.slice(1, -1).join(' ');
  lines.push(`N:${lastName};${firstName};${middleNames};;`);

  if (contact.nickname) {
    lines.push(`NICKNAME:${contact.nickname}`);
  }

  if (contact.company) {
    lines.push(`ORG:${contact.company}`);
  }

  if (contact.jobTitle) {
    lines.push(`TITLE:${contact.jobTitle}`);
  }

  contact.phones.forEach((p) => {
    let typeTag = 'CELL';
    if (p.type === 'work') typeTag = 'WORK';
    if (p.type === 'home') typeTag = 'HOME';
    if (p.type === 'whatsapp') typeTag = 'CELL;X-WHATSAPP';
    lines.push(`TEL;TYPE=${typeTag}${p.isPrimary ? ',PREF' : ''}:${p.number}`);
  });

  contact.emails.forEach((e) => {
    let typeTag = 'INTERNET';
    if (e.type === 'work') typeTag = 'WORK,INTERNET';
    if (e.type === 'personal') typeTag = 'HOME,INTERNET';
    lines.push(`EMAIL;TYPE=${typeTag}${e.isPrimary ? ',PREF' : ''}:${e.email}`);
  });

  if (contact.address) {
    const { street = '', city = '', state = '', postalCode = '', country = 'Brasil' } = contact.address;
    lines.push(`ADR;TYPE=HOME:;;${street};${city};${state};${postalCode};${country}`);
  }

  if (contact.birthday) {
    lines.push(`BDAY:${contact.birthday}`);
  }

  if (contact.tags && contact.tags.length > 0) {
    lines.push(`CATEGORIES:${contact.tags.join(',')}`);
  }

  if (contact.notes) {
    const sanitizedNotes = contact.notes.replace(/\n/g, '\\n');
    lines.push(`NOTE:${sanitizedNotes}`);
  }

  if (contact.isEmergencyIce) {
    lines.push('X-ICE:TRUE');
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Generates bulk vCards file content
 */
export function generateBulkVCards(contacts: Contact[]): string {
  return contacts.map(generateVCard).join('\r\n\r\n');
}

/**
 * Parses a .vcf vCard file string into Contact objects
 */
export function parseVCardString(vcfContent: string): Contact[] {
  const contacts: Contact[] = [];
  const cardBlocks = vcfContent.split(/BEGIN:VCARD/i).filter((b) => b.trim().length > 0);

  cardBlocks.forEach((block) => {
    const lines = block
      .replace(/\r\n\s+/g, '') // Unfold multiline headers
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let name = '';
    let nickname = '';
    let company = '';
    let jobTitle = '';
    const phones: PhoneNumber[] = [];
    const emails: EmailAddress[] = [];
    let birthday = '';
    let notes = '';
    let isEmergencyIce = false;
    const tags: string[] = [];

    lines.forEach((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;

      const rawProp = line.slice(0, colonIdx);
      const val = line.slice(colonIdx + 1).trim();
      const propUpper = rawProp.toUpperCase();

      if (propUpper === 'FN' || propUpper.startsWith('FN;')) {
        name = val;
      } else if (!name && (propUpper === 'N' || propUpper.startsWith('N;'))) {
        const parts = val.split(';');
        const last = parts[0] || '';
        const first = parts[1] || '';
        const mid = parts[2] || '';
        name = [first, mid, last].filter(Boolean).join(' ');
      } else if (propUpper.startsWith('NICKNAME')) {
        nickname = val;
      } else if (propUpper.startsWith('ORG')) {
        company = val.split(';')[0];
      } else if (propUpper.startsWith('TITLE')) {
        jobTitle = val;
      } else if (propUpper.startsWith('TEL')) {
        let type: PhoneNumber['type'] = 'mobile';
        if (propUpper.includes('WORK')) type = 'work';
        else if (propUpper.includes('HOME')) type = 'home';
        else if (propUpper.includes('WHATSAPP')) type = 'whatsapp';
        
        phones.push({
          id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          number: val,
          type,
          isPrimary: phones.length === 0,
        });
      } else if (propUpper.startsWith('EMAIL')) {
        let type: EmailAddress['type'] = 'personal';
        if (propUpper.includes('WORK')) type = 'work';
        emails.push({
          id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: val,
          type,
          isPrimary: emails.length === 0,
        });
      } else if (propUpper.startsWith('BDAY')) {
        birthday = val;
      } else if (propUpper.startsWith('NOTE')) {
        notes = val.replace(/\\n/g, '\n');
      } else if (propUpper.startsWith('CATEGORIES')) {
        val.split(',').forEach((t) => {
          const cleanTag = t.trim();
          if (cleanTag && !tags.includes(cleanTag)) tags.push(cleanTag);
        });
      } else if (propUpper.includes('ICE')) {
        isEmergencyIce = true;
      }
    });

    if (name || phones.length > 0 || emails.length > 0) {
      contacts.push({
        id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: name || 'Contato Sem Nome',
        nickname,
        company,
        jobTitle,
        phones,
        emails,
        birthday,
        notes,
        tags: tags.length > 0 ? tags : ['Importado'],
        isFavorite: false,
        isEmergencyIce,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return contacts;
}

/**
 * Generates standard Google Contacts & Apple Contacts compatible CSV
 */
export function generateCsv(contacts: Contact[]): string {
  const headers = [
    'Name',
    'Given Name',
    'Family Name',
    'Company',
    'Job Title',
    'Primary Phone',
    'Mobile Phone',
    'Work Phone',
    'Primary Email',
    'Work Email',
    'Birthday',
    'Group Membership',
    'Notes',
  ];

  const rows = contacts.map((c) => {
    const nameParts = c.name.split(' ');
    const givenName = nameParts[0] || '';
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const primaryPhone = c.phones[0]?.number || '';
    const mobilePhone = c.phones.find((p) => p.type === 'mobile' || p.type === 'whatsapp')?.number || '';
    const workPhone = c.phones.find((p) => p.type === 'work')?.number || '';
    const primaryEmail = c.emails[0]?.email || '';
    const workEmail = c.emails.find((e) => e.type === 'work')?.email || '';
    const tags = c.tags.join(' ::: ');
    const notes = (c.notes || '').replace(/"/g, '""');

    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${givenName}"`,
      `"${familyName}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.jobTitle || '').replace(/"/g, '""')}"`,
      `"${primaryPhone}"`,
      `"${mobilePhone}"`,
      `"${workPhone}"`,
      `"${primaryEmail}"`,
      `"${workEmail}"`,
      `"${c.birthday || ''}"`,
      `"${tags}"`,
      `"${notes}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Parses basic CSV (comma or semicolon separated)
 */
export function parseCsvString(csvContent: string): Contact[] {
  const contacts: Contact[] = [];
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return contacts;

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('nome'));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('telefone') || h.includes('celular') || h.includes('mobile'));
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('e-mail'));
  const companyIdx = headers.findIndex((h) => h.includes('company') || h.includes('empresa') || h.includes('org'));
  const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('nota') || h.includes('obs'));

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    const name = nameIdx !== -1 ? rawCols[nameIdx] : '';
    const phone = phoneIdx !== -1 ? rawCols[phoneIdx] : '';
    const email = emailIdx !== -1 ? rawCols[emailIdx] : '';
    const company = companyIdx !== -1 ? rawCols[companyIdx] : '';
    const notes = notesIdx !== -1 ? rawCols[notesIdx] : '';

    if (name || phone || email) {
      contacts.push({
        id: `cnt_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name || phone || 'Contato Importado',
        company,
        phones: phone
          ? [
              {
                id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                number: phone,
                type: 'mobile',
                isPrimary: true,
              },
            ]
          : [],
        emails: email
          ? [
              {
                id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                email,
                type: 'personal',
                isPrimary: true,
              },
            ]
          : [],
        notes,
        tags: ['CSV Importado'],
        isFavorite: false,
        isEmergencyIce: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return contacts;
}

/**
 * Triggers client-side browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates QR Code Data URL for scanning directly to mobile phonebook
 */
export async function generateVCardQrDataUrl(contact: Contact): Promise<string> {
  const vcardText = generateVCard(contact);
  try {
    return await QRCode.toDataURL(vcardText, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate vCard QR Code', err);
    return '';
  }
}
