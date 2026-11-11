import * as XLSX from 'xlsx';
import { Contact, PhoneNumber, EmailAddress } from '../types/contact';
import { maskPhoneInput } from './phoneFormatter';

export interface ImportResult {
  contacts: Contact[];
  totalRowsProcessed: number;
  skippedEmptyCount: number;
  errors: string[];
  detectedColumns: string[];
  sourceType: 'excel' | 'csv' | 'paste' | 'vcard' | 'json';
}

/**
 * Normalizes text for header matching: removes accents, lowers case, trims
 */
function normalizeHeader(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a string looks like an email address
 */
function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/**
 * Checks if a string looks like a phone number (at least 8 digits)
 */
function isPhoneNumber(val: string): boolean {
  const digits = val.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Sanitizes and generates a safe unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safe Contact Row Builder with defensive try/catch on every record
 */
function buildContactFromFields(
  rawName: unknown,
  rawPhone: unknown,
  rawEmail?: unknown,
  rawCompany?: unknown,
  rawGroup?: unknown,
  rawJobTitle?: unknown,
  rawNotes?: unknown,
  rawAddress?: unknown
): Contact | null {
  try {
    const nameStr = rawName !== undefined && rawName !== null ? String(rawName).trim() : '';
    const phoneStr = rawPhone !== undefined && rawPhone !== null ? String(rawPhone).trim() : '';
    const emailStr = rawEmail !== undefined && rawEmail !== null ? String(rawEmail).trim() : '';
    const companyStr = rawCompany !== undefined && rawCompany !== null ? String(rawCompany).trim() : '';
    const groupStr = rawGroup !== undefined && rawGroup !== null ? String(rawGroup).trim() : '';
    const jobStr = rawJobTitle !== undefined && rawJobTitle !== null ? String(rawJobTitle).trim() : '';
    const notesStr = rawNotes !== undefined && rawNotes !== null ? String(rawNotes).trim() : '';
    const addrStr = rawAddress !== undefined && rawAddress !== null ? String(rawAddress).trim() : '';

    // If there is zero data in all primary fields, skip
    if (!nameStr && !phoneStr && !emailStr && !companyStr) {
      return null;
    }

    // Determine final name: if no name is given, fallback to Company or Phone
    const finalName = nameStr || companyStr || phoneStr || 'Contato Sem Nome';

    // Build phones array
    const phones: PhoneNumber[] = [];
    if (phoneStr) {
      // Might contain multiple numbers separated by slash, comma, or pipe
      const splitPhones = phoneStr.split(/[/|,;]/).map((p) => p.trim()).filter(Boolean);
      const targetPhones = splitPhones.length > 0 ? splitPhones : [phoneStr];

      targetPhones.forEach((p, idx) => {
        const masked = maskPhoneInput(p);
        phones.push({
          id: generateId(`ph_${idx}`),
          number: masked || p,
          type: idx === 0 ? 'mobile' : 'work',
          isPrimary: idx === 0,
        });
      });
    }

    // Build emails array
    const emails: EmailAddress[] = [];
    if (emailStr) {
      const splitEmails = emailStr.split(/[/|,;]/).map((e) => e.trim()).filter(Boolean);
      const targetEmails = splitEmails.length > 0 ? splitEmails : [emailStr];

      targetEmails.forEach((e, idx) => {
        emails.push({
          id: generateId(`em_${idx}`),
          email: e,
          type: idx === 0 ? 'personal' : 'work',
          isPrimary: idx === 0,
        });
      });
    }

    // Build tags/groups
    const tags: string[] = [];
    if (groupStr) {
      groupStr
        .split(/[,;|/]/)
        .map((g) => g.trim())
        .filter(Boolean)
        .forEach((t) => {
          if (!tags.includes(t)) tags.push(t);
        });
    }
    if (tags.length === 0) {
      tags.push('Importado');
    }

    const now = new Date().toISOString();

    const contact: Contact = {
      id: generateId('cnt_imp'),
      name: finalName,
      company: companyStr || undefined,
      jobTitle: jobStr || undefined,
      phones,
      emails,
      tags,
      notes: notesStr || undefined,
      address: addrStr ? { street: addrStr } : undefined,
      isFavorite: false,
      isEmergencyIce: false,
      createdAt: now,
      updatedAt: now,
    };

    return contact;
  } catch (err) {
    console.warn('Defensive error parsing individual contact row:', err);
    return null;
  }
}

/**
 * Identifies column mapping based on headers
 */
interface ColumnIndices {
  name: number;
  phone: number;
  email: number;
  company: number;
  group: number;
  jobTitle: number;
  notes: number;
  address: number;
}

function detectColumns(headers: string[]): ColumnIndices {
  const norm = headers.map(normalizeHeader);

  const findIdx = (keywords: string[]) => {
    return norm.findIndex((h) => keywords.some((k) => h === k || h.includes(k)));
  };

  return {
    // Matches: "Nome", "Nome Completo", "Contato", "Name", "Cliente"
    name: findIdx(['nome completo', 'nome', 'contato', 'name', 'cliente', 'full name']),
    // Matches: "TELEFONE", "Telefone", "Celular", "Mobile", "Fone", "Tel", "Whatsapp"
    phone: findIdx(['telefone', 'celular', 'mobile', 'fone', 'tel', 'whatsapp', 'phone']),
    // Matches: "EMPRESAS", "Empresa", "Organização", "Company", "Org"
    company: findIdx(['empresas', 'empresa', 'organizacao', 'company', 'org', 'firma', 'corporacao']),
    // Matches: "Grupo", "Grupos", "Tag", "Tags", "Categoria", "Setor"
    group: findIdx(['grupo', 'grupos', 'tag', 'tags', 'categoria', 'categorias', 'setor', 'segmento']),
    // Matches: "Email", "E-mail", "Mail"
    email: findIdx(['email', 'e-mail', 'mail', 'correio']),
    // Matches: "Cargo", "Função", "Title", "Job"
    jobTitle: findIdx(['cargo', 'funcao', 'title', 'job', 'profissao']),
    // Matches: "Notas", "Observação", "Obs", "Notes"
    notes: findIdx(['nota', 'notas', 'observacao', 'observacoes', 'obs', 'notes', 'comentarios']),
    // Matches: "Endereço", "Cidade", "Address", "City"
    address: findIdx(['endereco', 'cidade', 'address', 'city', 'local']),
  };
}

/**
 * 1. Process Excel Spreadsheets (.xlsx, .xls, .csv via SheetJS)
 * Reads the first sheet dynamically, identifies column headers, and safely parses contacts.
 */
export function parseExcelBuffer(buffer: ArrayBuffer | Uint8Array): ImportResult {
  const contacts: Contact[] = [];
  const errors: string[] = [];
  let skippedEmptyCount = 0;
  let totalRowsProcessed = 0;
  let detectedColumns: string[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return {
        contacts: [],
        totalRowsProcessed: 0,
        skippedEmptyCount: 0,
        errors: ['O arquivo de planilha não possui nenhuma aba legível.'],
        detectedColumns: [],
        sourceType: 'excel',
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to 2D array: (string | number | undefined)[][]
    const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length === 0) {
      return {
        contacts: [],
        totalRowsProcessed: 0,
        skippedEmptyCount: 0,
        errors: ['A primeira aba da planilha está totalmente vazia.'],
        detectedColumns: [],
        sourceType: 'excel',
      };
    }

    // Inspect first row for headers
    const headerRow = (rawRows[0] || []).map((v) => (v !== undefined && v !== null ? String(v).trim() : ''));
    const colIndices = detectColumns(headerRow);

    // Record detected columns for user transparency
    detectedColumns = headerRow.filter((h) => h.length > 0);

    const hasHeaderRow =
      colIndices.name !== -1 ||
      colIndices.phone !== -1 ||
      colIndices.company !== -1 ||
      colIndices.group !== -1 ||
      colIndices.email !== -1;

    const startIndex = hasHeaderRow ? 1 : 0;

    for (let r = startIndex; r < rawRows.length; r++) {
      totalRowsProcessed++;
      const row = rawRows[r];

      // Check if row is completely empty
      if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
        skippedEmptyCount++;
        continue;
      }

      try {
        let nameVal = '';
        let phoneVal = '';
        let emailVal = '';
        let companyVal = '';
        let groupVal = '';
        let jobVal = '';
        let notesVal = '';
        let addrVal = '';

        if (hasHeaderRow) {
          nameVal = colIndices.name !== -1 ? String(row[colIndices.name] || '') : '';
          phoneVal = colIndices.phone !== -1 ? String(row[colIndices.phone] || '') : '';
          companyVal = colIndices.company !== -1 ? String(row[colIndices.company] || '') : '';
          groupVal = colIndices.group !== -1 ? String(row[colIndices.group] || '') : '';
          emailVal = colIndices.email !== -1 ? String(row[colIndices.email] || '') : '';
          jobVal = colIndices.jobTitle !== -1 ? String(row[colIndices.jobTitle] || '') : '';
          notesVal = colIndices.notes !== -1 ? String(row[colIndices.notes] || '') : '';
          addrVal = colIndices.address !== -1 ? String(row[colIndices.address] || '') : '';
        } else {
          // Positional fallback when no headers exist
          const strings = row.map((cell) => (cell !== undefined && cell !== null ? String(cell).trim() : ''));
          for (let ci = 0; ci < strings.length; ci++) {
            const val = strings[ci];
            if (!val) continue;

            if (isEmail(val) && !emailVal) {
              emailVal = val;
            } else if (isPhoneNumber(val) && !phoneVal) {
              phoneVal = val;
            } else if (!nameVal) {
              nameVal = val;
            } else if (!companyVal) {
              companyVal = val;
            } else if (!groupVal) {
              groupVal = val;
            }
          }
        }

        const contact = buildContactFromFields(
          nameVal,
          phoneVal,
          emailVal,
          companyVal,
          groupVal,
          jobVal,
          notesVal,
          addrVal
        );

        if (contact) {
          contacts.push(contact);
        } else {
          skippedEmptyCount++;
        }
      } catch (rowErr) {
        console.warn(`Erro defensivo ao processar linha ${r + 1} do Excel:`, rowErr);
        errors.push(`Linha ${r + 1}: dados inconsistentes ignorados com segurança.`);
      }
    }
  } catch (err: any) {
    console.error('Falha geral ao decodificar arquivo Excel:', err);
    errors.push(err?.message || 'Falha ao interpretar arquivo da planilha.');
  }

  return {
    contacts,
    totalRowsProcessed,
    skippedEmptyCount,
    errors,
    detectedColumns,
    sourceType: 'excel',
  };
}

/**
 * 2. Process Copied and Pasted Raw Text (Ctrl+C / Ctrl+V)
 * Splits lines by newline, then fields by tab (\t), semicolon (;), or comma (,).
 * Handles inputs copied directly from Excel, Google Sheets, CSV or Notepad.
 */
export function parsePastedText(rawText: string): ImportResult {
  const contacts: Contact[] = [];
  const errors: string[] = [];
  let skippedEmptyCount = 0;
  let totalRowsProcessed = 0;
  let detectedColumns: string[] = [];

  try {
    if (!rawText || !rawText.trim()) {
      return {
        contacts: [],
        totalRowsProcessed: 0,
        skippedEmptyCount: 0,
        errors: ['Nenhum texto informado para importação.'],
        detectedColumns: [],
        sourceType: 'paste',
      };
    }

    // Split text into lines
    const lines = rawText.split(/\r?\n/);

    // Detect delimiter from first non-empty lines: tab (\t) is default when copying from Excel/Sheets, else ; or ,
    let delimiter = '\t';
    const firstLinesSample = lines.slice(0, 5).filter((l) => l.trim().length > 0);
    const hasTabs = firstLinesSample.some((l) => l.includes('\t'));
    const hasSemicolons = firstLinesSample.some((l) => l.includes(';'));
    const hasCommas = firstLinesSample.some((l) => l.includes(','));

    if (hasTabs) {
      delimiter = '\t';
    } else if (hasSemicolons) {
      delimiter = ';';
    } else if (hasCommas) {
      delimiter = ',';
    }

    // Helper to split a line safely, considering quotes
    const splitLine = (line: string): string[] => {
      if (delimiter === '\t') {
        return line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }
      // Simple regex or split for CSV/Semicolon
      return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    };

    // Find first non-empty line to check for headers
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return {
        contacts: [],
        totalRowsProcessed: 0,
        skippedEmptyCount: lines.length,
        errors: ['O texto colado não contém linhas preenchidas.'],
        detectedColumns: [],
        sourceType: 'paste',
      };
    }

    const firstRowTokens = splitLine(lines[headerIndex]);
    const colIndices = detectColumns(firstRowTokens);

    const hasHeaderRow =
      colIndices.name !== -1 ||
      colIndices.phone !== -1 ||
      colIndices.company !== -1 ||
      colIndices.group !== -1 ||
      colIndices.email !== -1;

    if (hasHeaderRow) {
      detectedColumns = firstRowTokens.filter((t) => t.length > 0);
    }

    const startRow = hasHeaderRow ? headerIndex + 1 : headerIndex;

    for (let i = startRow; i < lines.length; i++) {
      totalRowsProcessed++;
      const rawLine = lines[i];

      // Skip totally blank lines
      if (!rawLine || !rawLine.trim()) {
        skippedEmptyCount++;
        continue;
      }

      try {
        const tokens = splitLine(rawLine);

        // Check if all tokens are empty
        if (tokens.every((t) => !t)) {
          skippedEmptyCount++;
          continue;
        }

        let nameVal = '';
        let phoneVal = '';
        let emailVal = '';
        let companyVal = '';
        let groupVal = '';
        let jobVal = '';
        let notesVal = '';
        let addrVal = '';

        if (hasHeaderRow) {
          nameVal = colIndices.name !== -1 ? tokens[colIndices.name] || '' : '';
          phoneVal = colIndices.phone !== -1 ? tokens[colIndices.phone] || '' : '';
          companyVal = colIndices.company !== -1 ? tokens[colIndices.company] || '' : '';
          groupVal = colIndices.group !== -1 ? tokens[colIndices.group] || '' : '';
          emailVal = colIndices.email !== -1 ? tokens[colIndices.email] || '' : '';
          jobVal = colIndices.jobTitle !== -1 ? tokens[colIndices.jobTitle] || '' : '';
          notesVal = colIndices.notes !== -1 ? tokens[colIndices.notes] || '' : '';
          addrVal = colIndices.address !== -1 ? tokens[colIndices.address] || '' : '';
        } else {
          // Dynamic positional heuristic when no headers exist
          // E.g. "João Silva | 11999998888 | joao@empresa.com | Tech Inc | Trabalho"
          for (let ti = 0; ti < tokens.length; ti++) {
            const token = tokens[ti];
            if (!token) continue;

            if (isEmail(token) && !emailVal) {
              emailVal = token;
            } else if (isPhoneNumber(token) && !phoneVal) {
              phoneVal = token;
            } else if (!nameVal) {
              nameVal = token;
            } else if (!companyVal) {
              companyVal = token;
            } else if (!groupVal) {
              groupVal = token;
            }
          }
        }

        const contact = buildContactFromFields(
          nameVal,
          phoneVal,
          emailVal,
          companyVal,
          groupVal,
          jobVal,
          notesVal,
          addrVal
        );

        if (contact) {
          contacts.push(contact);
        } else {
          skippedEmptyCount++;
        }
      } catch (lineErr) {
        console.warn(`Erro defensivo ao processar linha colada ${i + 1}:`, lineErr);
        errors.push(`Linha ${i + 1}: erro de formatação ignorado com segurança.`);
      }
    }
  } catch (err: any) {
    console.error('Falha geral no processamento do texto colado:', err);
    errors.push(err?.message || 'Erro ao interpretar texto colado.');
  }

  return {
    contacts,
    totalRowsProcessed,
    skippedEmptyCount,
    errors,
    detectedColumns,
    sourceType: 'paste',
  };
}
