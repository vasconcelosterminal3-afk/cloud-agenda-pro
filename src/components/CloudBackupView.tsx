import React, { useState, useRef } from 'react';
import {
  Cloud,
  ShieldCheck,
  RefreshCw,
  Clock,
  HardDrive,
  Download,
  RotateCcw,
  GitCompare,
  Trash2,
  Plus,
  CheckCircle2,
  Smartphone,
  Laptop,
  Radio,
  FileCode,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { Contact, CloudBackupSnapshot } from '../types/contact';
import { generateBulkVCards, generateCsv, downloadFile } from '../utils/vcard';

interface CloudBackupViewProps {
  contacts: Contact[];
  snapshots: CloudBackupSnapshot[];
  isSyncing: boolean;
  onTriggerBackup: (label?: string) => void;
  onRestoreSnapshot: (snapshot: CloudBackupSnapshot) => void;
  onInspectDiff: (snapshot: CloudBackupSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onRestoreJsonBackup: (importedContacts: Contact[]) => Promise<{ addedCount: number; skippedCount: number }>;
}

export const CloudBackupView: React.FC<CloudBackupViewProps> = ({
  contacts,
  snapshots,
  isSyncing,
  onTriggerBackup,
  onRestoreSnapshot,
  onInspectDiff,
  onDeleteSnapshot,
  onRestoreJsonBackup,
}) => {
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);
  const [isRestoringJson, setIsRestoringJson] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download complete JSON backup file (Requirement 3: "Fazer Backup Agora (Baixar Arquivo)")
  const handleDownloadFullBackupJson = () => {
    const backupData = {
      app: 'CloudAgenda Pro',
      version: '4.5.0',
      exportedAt: new Date().toISOString(),
      encryption: 'AES-256-GCM / Firebase Cloud',
      totalContacts: contacts.length,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        nickname: c.nickname || '',
        company: c.company || '',
        jobTitle: c.jobTitle || '',
        phones: c.phones || [],
        emails: c.emails || [],
        address: c.address || {},
        tags: c.tags || [],
        notes: c.notes || '',
        isFavorite: Boolean(c.isFavorite),
        isEmergencyIce: Boolean(c.isEmergencyIce),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `cloudagenda_backup_${dateStr}.json`;
    downloadFile(JSON.stringify(backupData, null, 2), filename, 'application/json');
  };

  // Restore Backup from .json (Requirement 3: "Restaurar Backup")
  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringJson(true);
    setRestoreFeedback(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawList = Array.isArray(parsed) ? parsed : parsed.contacts || [];

      if (!Array.isArray(rawList) || rawList.length === 0) {
        setRestoreFeedback('Erro: O arquivo selecionado não contém uma lista válida de contatos.');
        setIsRestoringJson(false);
        return;
      }

      const res = await onRestoreJsonBackup(rawList);
      setRestoreFeedback(
        `Restauração concluída com sucesso! ${res.addedCount} novos contatos gravados no Firebase (${res.skippedCount} contatos já existentes foram preservados sem duplicação).`
      );
    } catch (err: any) {
      console.error('Falha ao restaurar arquivo JSON:', err);
      setRestoreFeedback('Erro ao ler o arquivo JSON. Certifique-se de selecionar um backup válido do CloudAgenda.');
    } finally {
      setIsRestoringJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerBackup(newSnapshotLabel.trim() || undefined);
    setNewSnapshotLabel('');
    setIsCreatingManual(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8 px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
      {/* Hero Cloud Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#0A0D14] p-8 text-white shadow-2xl shadow-indigo-950/20 dark:border-white/[0.08]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Firebase Cloud Firestore Ativo
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Persistência Permanente & Real-time
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Backup & Segurança da Agenda
            </h1>
            <p className="max-w-2xl text-xs md:text-sm text-slate-300 font-normal leading-relaxed">
              Todos os seus contatos são sincronizados continuamente no Cloud Firestore com vínculo seguro ao seu UID de usuário. Exporte backups offline em JSON ou restaure sem duplicar dados.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Button 1: Fazer Backup Agora (Baixar Arquivo) */}
            <button
              onClick={handleDownloadFullBackupJson}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-98 transition-all duration-200 hover:-translate-y-0.5"
            >
              <FileDown className="h-4 w-4" />
              <span>Fazer Backup Agora (Baixar Arquivo)</span>
            </button>

            {/* Button 2: Restaurar Backup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoringJson}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-98 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Upload className="h-4 w-4" />
              <span>{isRestoringJson ? 'Restaurando...' : 'Restaurar Backup'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </div>
        </div>

        {/* Feedback alert */}
        {restoreFeedback && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/10 p-4 border border-white/15 text-xs text-emerald-300 backdrop-blur-md animate-slide-up">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{restoreFeedback}</span>
          </div>
        )}

        {/* Cloud Stats strip */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6 text-xs">
          <div>
            <div className="text-slate-400">Contatos no Firestore</div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums">
              {contacts.length} contatos
            </div>
          </div>
          <div>
            <div className="text-slate-400">Pontos de Snapshot</div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums">
              {snapshots.length} versões
            </div>
          </div>
          <div>
            <div className="text-slate-400">Status de Sincronização</div>
            <div className="mt-1 text-emerald-400 font-semibold flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Nuvem em Tempo Real</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400">Prevenção de Duplicatas</div>
            <div className="mt-1 text-sky-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Ativa na Restauração</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Snapshot Modal / Box if open */}
      {isCreatingManual && (
        <form
          onSubmit={handleCreateSnapshot}
          className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                Nome ou Rótulo do Ponto de Restauração
              </label>
              <input
                type="text"
                autoFocus
                required
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                placeholder="Ex: Backup Antes da Troca de Aparelho, Viagem aos EUA, etc."
                className="mt-1.5 w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-indigo-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingManual(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm"
              >
                Salvar Snapshot
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Backup and Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: JSON Full Backup */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 dark:border-white/[0.06] dark:bg-[#0E121B] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <FileCode className="h-4 w-4 text-purple-500" />
              <span>Backup Integral em JSON</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Arquivo estruturado com todos os contatos ({contacts.length}), telefones, e-mails, tags e anotações.
            </p>
          </div>
          <button
            onClick={handleDownloadFullBackupJson}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Arquivo .JSON</span>
          </button>
        </div>

        {/* Card 2: vCard .vcf */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 dark:border-white/[0.06] dark:bg-[#0E121B] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Smartphone className="h-4 w-4 text-indigo-500" />
              <span>vCard Universal (.vcf)</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Padrão universal compatível com iPhone (Apple Contacts), Android (Google), Outlook e Mac.
            </p>
          </div>
          <button
            onClick={() => {
              const vcf = generateBulkVCards(contacts);
              const dateStr = new Date().toISOString().split('T')[0];
              downloadFile(vcf, `agenda_vcard_${dateStr}.vcf`, 'text/vcard');
            }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Arquivo .VCF</span>
          </button>
        </div>

        {/* Card 3: Excel CSV */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 dark:border-white/[0.06] dark:bg-[#0E121B] shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              <span>Planilha Google & Excel (.csv)</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Planilha estruturada com colunas separadas para importar no Google Contatos ou analisar no Excel.
            </p>
          </div>
          <button
            onClick={() => {
              const csv = generateCsv(contacts);
              const dateStr = new Date().toISOString().split('T')[0];
              downloadFile(csv, `agenda_excel_${dateStr}.csv`, 'text/csv');
            }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Planilha .CSV</span>
          </button>
        </div>
      </div>

      {/* Snapshots Timeline Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Histórico de Pontos de Restauração em Nuvem
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione qualquer momento anterior para restaurar contatos ou inspecionar diferenças (Diff).
            </p>
          </div>
          <button
            onClick={() => setIsCreatingManual(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Ponto</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-white/[0.06] dark:bg-[#0E121B]">
            Nenhum snapshot manual registrado ainda. Crie um ponto antes de realizar grandes importações ou edições.
          </div>
        ) : (
          <div className="space-y-3">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-2xs hover:shadow-sm dark:border-white/[0.06] dark:bg-[#0E121B] transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {snap.label}
                    </span>
                    {snap.isAutomatic && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-medium">
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {snap.createdAt} • {snap.contactCount} contatos • Checksum: <code className="font-mono text-[10px]">{snap.checksum}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onInspectDiff(snap)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 transition-colors"
                  >
                    <GitCompare className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Comparar</span>
                  </button>

                  <button
                    onClick={() => onRestoreSnapshot(snap)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Excluir Ponto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
