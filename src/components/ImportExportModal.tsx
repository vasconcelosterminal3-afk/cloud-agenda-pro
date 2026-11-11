import React, { useState, useRef, useEffect } from 'react';
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
  ClipboardPaste,
  Sparkles,
  CloudUpload,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Tag,
  Check,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  parseVCardString,
  generateBulkVCards,
  generateCsv,
  downloadFile,
} from '../utils/vcard';
import {
  parseExcelBuffer,
  parsePastedText,
  ImportResult,
} from '../utils/universalImporter';

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
  const [importMethod, setImportMethod] = useState<'file' | 'paste' | 'device'>('file');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  
  // Paste import state
  const [pastedText, setPastedText] = useState<string>('');
  
  // Parsed results and preview state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Global Ctrl+V / Cmd+V listener when modal is open and not focusing another input
  useEffect(() => {
    if (!isOpen || activeTab !== 'import') return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // If user is already typing inside the textarea, let default paste behavior occur
      if (document.activeElement === pasteTextareaRef.current) return;
      
      const clipboardData = e.clipboardData?.getData('text');
      if (clipboardData && clipboardData.trim().length > 0) {
        // Switch to paste tab and process text
        setImportMethod('paste');
        setPastedText(clipboardData);
        processRawText(clipboardData, 'Clipboard (Ctrl+V Direto)');
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Process text safely
  const processRawText = (text: string, label: string) => {
    setErrorMsg('');
    setIsProcessing(true);
    try {
      const res = parsePastedText(text);
      if (res.contacts.length === 0) {
        setErrorMsg('Nenhum contato válido foi reconhecido no texto informado.');
        setImportResult(null);
      } else {
        setImportResult(res);
        setSourceName(label);
      }
    } catch (err: any) {
      console.error('Defensive error parsing text:', err);
      setErrorMsg('Erro inesperado ao processar o texto colado.');
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process file upload safely (.xlsx, .xls, .csv, .vcf, .json)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSourceName(file.name);
    setIsProcessing(true);

    const ext = file.name.toLowerCase();

    try {
      if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) {
        // Read via ArrayBuffer using SheetJS (XLSX)
        const buffer = await file.arrayBuffer();
        const res = parseExcelBuffer(buffer);
        if (res.contacts.length === 0) {
          setErrorMsg(res.errors[0] || 'Nenhum contato válido foi encontrado na planilha.');
          setImportResult(null);
        } else {
          setImportResult(res);
        }
      } else if (ext.endsWith('.vcf') || ext.endsWith('.vcard')) {
        const text = await file.text();
        const list = parseVCardString(text);
        if (list.length === 0) {
          setErrorMsg('Nenhum contato válido foi encontrado no arquivo .vcf.');
          setImportResult(null);
        } else {
          setImportResult({
            contacts: list,
            totalRowsProcessed: list.length,
            skippedEmptyCount: 0,
            errors: [],
            detectedColumns: ['FN (Nome)', 'TEL (Telefone)', 'EMAIL (E-mail)', 'ORG (Empresa)'],
            sourceType: 'vcard',
          });
        }
      } else if (ext.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list: Contact[] = Array.isArray(parsed) ? parsed : parsed.contacts || [];
        if (list.length === 0) {
          setErrorMsg('Arquivo JSON não possui estrutura de contatos.');
          setImportResult(null);
        } else {
          setImportResult({
            contacts: list,
            totalRowsProcessed: list.length,
            skippedEmptyCount: 0,
            errors: [],
            detectedColumns: ['JSON Schema Universal'],
            sourceType: 'json',
          });
        }
      } else {
        setErrorMsg('Formato de arquivo não suportado. Por favor utilize .xlsx, .xls, .csv, .vcf ou .json.');
        setImportResult(null);
      }
    } catch (err: any) {
      console.error('Defensive error parsing uploaded file:', err);
      setErrorMsg('Falha ao processar arquivo: ' + (err?.message || 'Arquivo corrompido ou formato inválido.'));
      setImportResult(null);
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Browser Web Contacts Picker API (Chrome Android / Mobile)
  const handleNativeDevicePicker = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        setIsProcessing(true);
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

          setImportResult({
            contacts: converted,
            totalRowsProcessed: converted.length,
            skippedEmptyCount: 0,
            errors: [],
            detectedColumns: ['API de Contatos Nativos do Aparelho'],
            sourceType: 'vcard',
          });
          setSourceName('Agenda do Celular (Aparelho Nativo)');
        }
      } catch (err) {
        console.warn('Native contact select cancelled or unsupported', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setErrorMsg('Seu navegador não suporta a API de leitura direta do celular. Utilize exportação de arquivo .vcf ou copie e cole.');
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.contacts.length === 0) return;
    onImportContacts(importResult.contacts, importMode);
    onClose();
  };

  const handleResetImportSelection = () => {
    setImportResult(null);
    setErrorMsg('');
    setPastedText('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08]">
        
        {/* Header with Segmented Tab switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/[0.06] bg-white dark:bg-[#0E121B] shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.04]">
            <button
              onClick={() => {
                setActiveTab('import');
                handleResetImportSelection();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.14] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Importação Universal</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'export'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.14] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Exportar Agenda</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'import' && (
            <>
              {/* If no contacts are parsed yet: show Method Selector */}
              {!importResult ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Central de Importação Pro</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                          <Sparkles className="h-2.5 w-2.5" />
                          Excel • Ctrl+V • vCard
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Importe sua agenda de qualquer lugar com detecção dinâmica e validação defensiva.
                      </p>
                    </div>
                  </div>

                  {/* Import Mode Selector: Arquivo / Colar Texto / Celular */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/70 rounded-2xl dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setImportMethod('file')}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        importMethod === 'file'
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Planilha / Arquivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMethod('paste')}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        importMethod === 'paste'
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <ClipboardPaste className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Copiar & Colar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMethod('device')}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        importMethod === 'device'
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Celular Nativo</span>
                    </button>
                  </div>

                  {/* METHOD 1: Excel / File Upload */}
                  {importMethod === 'file' && (
                    <div className="space-y-3">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:border-indigo-400 dark:hover:bg-slate-800/40 transition-all duration-200 group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv,.vcf,.vcard,.json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          Selecione ou solte sua planilha do Excel ou arquivo
                        </div>
                        <div className="text-xs text-slate-500 mt-1 max-w-sm">
                          Formatos aceitos com detecção inteligente de colunas: <br />
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">.xlsx, .xls, .csv, .vcf, .json</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.04] text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Reconhecimento Automático:</strong> O sistema identifica qualquer cabeçalho de coluna como <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">Nome</code>, <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">Telefone</code>, <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">Empresas</code>, <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">Grupo</code> e <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">E-mail</code> sem necessidade de ajustes manuais.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* METHOD 2: Paste Area (Ctrl+C / Ctrl+V) */}
                  {importMethod === 'paste' && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ClipboardPaste className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Campo de Captura Rápida (Cole direto com Ctrl+V)</span>
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Aceita Tabulações (\t), Ponto e Vírgula (;) ou Vírgulas (,)
                          </span>
                        </div>
                        <textarea
                          ref={pasteTextareaRef}
                          rows={6}
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder={`Copie as células do Excel, Google Sheets ou Bloco de Notas e cole aqui:\n\nExemplo com cabeçalho ou direto:\nNome\tTelefone\tEmpresas\tGrupo\nAna Maria\t11 98888-7777\tTech Soluções\tTrabalho\nCarlos Souza\t21 97777-6666\tAlpha Corp\tClientes\nDr. Roberto\t31 3222-1111\tClínica Saúde\tMédicos`}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-200 focus:outline-none transition-all shadow-inner"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setPastedText('')}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          Limpar Texto
                        </button>

                        <button
                          type="button"
                          disabled={!pastedText.trim() || isProcessing}
                          onClick={() => processRawText(pastedText, 'Texto Colado (Área de Captura)')}
                          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Processar e Analisar Contatos</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* METHOD 3: Device Native */}
                  {importMethod === 'device' && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Sincronização Direta da Memória do Celular
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Utiliza a API nativa de contatos do navegador móvel (Chrome Android). Acessa os contatos salvos no chip ou na conta Google do aparelho.
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleNativeDevicePicker}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all hover:-translate-y-0.5"
                        >
                          Abrir Seletor de Contatos do Aparelho
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-slide-up">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* PREVIEW & SAFE VALIDATION SUMMARY SCREEN */
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Top Confirmation Prompt Banner */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                            Detectamos {importResult.contacts.length} contatos prontos para importação.
                          </h4>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300/80 mt-0.5">
                            Deseja confirmar o salvamento na nuvem do Supabase?
                          </p>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                            Origem: {sourceName}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleResetImportSelection}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Trocar Dados</span>
                      </button>
                    </div>

                    {/* Detected Badges Metrics */}
                    <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Contatos Válidos</div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {importResult.contacts.length}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Telefones Mapeados</div>
                        <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {importResult.contacts.reduce((acc, c) => acc + c.phones.length, 0)}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">E-mails Mapeados</div>
                        <div className="text-base font-bold text-sky-600 dark:text-sky-400 font-mono">
                          {importResult.contacts.reduce((acc, c) => acc + c.emails.length, 0)}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/40 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Linhas Vazias Puladas</div>
                        <div className="text-base font-bold text-slate-600 dark:text-slate-400 font-mono">
                          {importResult.skippedEmptyCount}
                        </div>
                      </div>
                    </div>

                    {/* Detected columns info */}
                    {importResult.detectedColumns.length > 0 && (
                      <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Colunas identificadas:</span>
                        {importResult.detectedColumns.map((col, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-800 text-[10px] font-mono border border-emerald-200/50 dark:border-emerald-800/30"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview Table of First 5-8 contacts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Amostra dos Dados Processados (Primeiros {Math.min(importResult.contacts.length, 5)} contatos):
                      </div>
                      <span className="text-[11px] text-slate-400">Total: {importResult.contacts.length} registros</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 shadow-sm max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-white/[0.04] text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.06] sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Nome</th>
                            <th className="px-3 py-2">Telefone</th>
                            <th className="px-3 py-2">E-mail</th>
                            <th className="px-3 py-2">Empresa</th>
                            <th className="px-3 py-2">Grupo/Tag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {importResult.contacts.slice(0, 8).map((c, i) => (
                            <tr key={c.id || i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                                {c.name}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">
                                {c.phones[0]?.number || <span className="text-slate-400 italic">sem telefone</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {c.emails[0]?.email || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {c.company || '-'}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {c.tags[0] || 'Importado'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mode: Append or Replace */}
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-slate-900/60">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
                      Como deseja salvar na nuvem?
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <label
                        className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                          importMode === 'append'
                            ? 'border-indigo-500 bg-white dark:bg-slate-800/90 shadow-sm'
                            : 'border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Mesclar e Adicionar
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Preserva seus {contacts.length} contatos atuais e soma os novos na nuvem.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                          importMode === 'replace'
                            ? 'border-indigo-500 bg-white dark:bg-slate-800/90 shadow-sm'
                            : 'border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Substituir Toda a Agenda
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Substitui a lista existente pelos novos {importResult.contacts.length} registros.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleResetImportSelection}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancelar e Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <CloudUpload className="h-4 w-4" />
                      <span>Confirmar e Salvar {importResult.contacts.length} Contatos na Nuvem</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 2: Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Exportar Dados da Agenda ({contacts.length} contatos)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha o padrão desejado para backup local, migração de celular ou planilhas do Excel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Option 1: vCard .vcf */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
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
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Baixar Arquivo .vcf</span>
                  </button>
                </div>

                {/* Option 2: Google Contacts / Excel CSV */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span>Google & Excel (.csv)</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Planilha estruturada com colunas de Nome, Sobrenome, Telefones, E-mails e Organização. Abre direto no Excel.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Baixar Planilha .csv</span>
                  </button>
                </div>

                {/* Option 3: Full Encrypted Vault JSON */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                      <ShieldCheck className="h-4 w-4 text-purple-500" />
                      <span>Cofre Criptografado (.json)</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Backup integral com metadados de segurança, fotos, tags customizadas e pontos de restauração.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Baixar Backup .json</span>
                  </button>
                </div>

                {/* Option 4: Print Contact Book */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
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
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimir Diretório</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 dark:border-white/[0.06] dark:bg-slate-900/60 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Validação defensiva de dados ativa contra falhas.</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
