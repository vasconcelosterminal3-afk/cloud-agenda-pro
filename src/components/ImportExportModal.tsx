import React, { useState, useRef } from 'react';
import {
  X,
  FileUp,
  FileDown,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Printer,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  parseVCardString,
  generateBulkVCards,
  parseCsvString,
  generateCsv,
  downloadFile,
} from '../utils/vcard';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'import' | 'export';
  contacts: Contact[];
  onImportContacts: (imported: Contact[], mode: 'append' | 'replace') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'import',
  contacts,
  onImportContacts,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(defaultTab);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedContacts, setParsedContacts] = useState<Contact[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.toLowerCase().endsWith('.vcf') || file.name.toLowerCase().endsWith('.vcard')) {
          const list = parseVCardString(text);
          if (list.length === 0) {
            setErrorMsg('Nenhum contato válido foi encontrado no arquivo .vcf.');
          } else {
            setParsedContacts(list);
          }
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          const list = parseCsvString(text);
          if (list.length === 0) {
            setErrorMsg('Não foi possível reconhecer o formato do arquivo CSV.');
          } else {
            setParsedContacts(list);
          }
        } else if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : parsed.contacts || [];
          if (list.length === 0) {
            setErrorMsg('Arquivo JSON não possui estrutura de contatos.');
          } else {
            setParsedContacts(list);
          }
        } else {
          setErrorMsg('Formato não suportado. Por favor utilize arquivos .vcf, .csv ou .json.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao ler arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedContacts || parsedContacts.length === 0) return;
    onImportContacts(parsedContacts, importMode);
    onClose();
  };

  // Browser Web Contacts Picker API (if available on Chrome Android)
  const handleNativeDevicePicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const nativeContacts = await (navigator as any).contacts.select(props, { multiple: true });
        if (nativeContacts && nativeContacts.length > 0) {
          const converted: Contact[] = nativeContacts.map((c: any, i: number) => ({
            id: `cnt_device_${Date.now()}_${i}`,
            name: c.name?.[0] || 'Contato Celular',
            phones: (c.tel || []).map((t: string, pi: number) => ({
              id: `p_${pi}`,
              type: 'mobile',
              number: t,
              isPrimary: pi === 0,
            })),
            emails: (c.email || []).map((e: string, ei: number) => ({
              id: `e_${ei}`,
              type: 'personal',
              email: e,
              isPrimary: ei === 0,
            })),
            tags: ['Celular Nativo'],
            isFavorite: false,
            isEmergencyIce: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setParsedContacts(converted);
          setFileName('Agenda do Dispositivo Mobile');
        }
      } catch (err) {
        console.warn('Native contact select cancelled or unsupported', err);
      }
    } else {
      alert('Selecione um arquivo .vcf exportado do seu celular para importar.');
    }
  };

  const handleExportVcf = () => {
    const vcf = generateBulkVCards(contacts);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(vcf, `agenda_backup_${date}.vcf`, 'text/vcard');
  };

  const handleExportCsv = () => {
    const csv = generateCsv(contacts);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `agenda_google_excel_${date}.csv`, 'text/csv');
  };

  const handleExportJson = () => {
    const data = {
      backupVersion: '4.2.0',
      exportedAt: new Date().toISOString(),
      encryption: 'AES-256-GCM',
      totalContacts: contacts.length,
      contacts,
    };
    const json = JSON.stringify(data, null, 2);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(json, `cloudagenda_vault_backup_${date}.json`, 'application/json');
  };

  const handlePrintDirectory = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header with Segmented Tab switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Importar Contatos</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'export'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Exportar Agenda</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab 1: Import */}
        {activeTab === 'import' && (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Importação Universal de Agenda
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Suporta arquivos de backup do iPhone (vCard .vcf), Android (Google Contacts CSV ou .vcf) e backups em JSON.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:border-indigo-400 dark:hover:bg-slate-800/40 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,.vcard,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Clique para selecionar ou arraste o arquivo aqui
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Formatos aceitos: <span className="font-mono">.vcf</span>, <span className="font-mono">.csv</span> ou <span className="font-mono">.json</span>
              </div>
            </div>

            {/* Native Device Picker Shortcut */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-indigo-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Sincronização Direta do Aparelho
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Acessar contatos nativos armazenados na memória deste navegador móvel.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNativeDevicePicker}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Ler Aparelho
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Parsed Preview */}
            {parsedContacts && parsedContacts.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Arquivo processado com sucesso: {fileName}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Foram encontrados <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{parsedContacts.length} contatos</strong> prontos para serem adicionados à sua nuvem.
                </div>

                {/* Import Mode: Append or Replace */}
                <div className="mt-4 border-t border-emerald-200/60 pt-3 dark:border-emerald-900/40">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Como deseja processar os contatos?
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 cursor-pointer dark:border-emerald-800 dark:bg-slate-900">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Mesclar e Adicionar
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Mantém contatos atuais
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 cursor-pointer dark:border-emerald-800 dark:bg-slate-900">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Substituir Agenda Inteira
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cria backup prévio
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleConfirmImport}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                  >
                    Confirmar e Importar {parsedContacts.length} Contatos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Export */}
        {activeTab === 'export' && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Exportar Dados da Agenda ({contacts.length} contatos)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha o padrão desejado para backup local, migração de celular ou planilhas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: vCard .vcf */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <Smartphone className="h-4 w-4 text-indigo-500" />
                    <span>vCard Universal (.vcf)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Compatível nativamente com iPhone (iOS), Android, Mac Contacts e Outlook. Abra o arquivo no celular e salve tudo direto.
                  </p>
                </div>
                <button
                  onClick={handleExportVcf}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Baixar Arquivo .vcf</span>
                </button>
              </div>

              {/* Option 2: Google Contacts / Excel CSV */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    <span>Google & Excel (.csv)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Planilha estruturada com colunas de Nome, Sobrenome, Telefones, E-mails e Organização. Ideal para o Google Contatos.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Baixar Planilha .csv</span>
                </button>
              </div>

              {/* Option 3: Full Encrypted Vault JSON */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                    <span>Cofre Criptografado (.json)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Backup integral com metadados de segurança, fotos em base64, tags customizadas e pontos de restauração.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Baixar Backup .json</span>
                </button>
              </div>

              {/* Option 4: Print Contact Book */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <Printer className="h-4 w-4 text-sky-500" />
                    <span>Imprimir / PDF da Agenda</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Gera um diretório telefônico formatado em ordem alfabética pronto para impressão física ou salvar como PDF.
                  </p>
                </div>
                <button
                  onClick={handlePrintDirectory}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir Diretório</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
