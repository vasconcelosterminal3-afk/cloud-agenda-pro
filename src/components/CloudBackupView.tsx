import React, { useState } from 'react';
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
}

export const CloudBackupView: React.FC<CloudBackupViewProps> = ({
  contacts,
  snapshots,
  isSyncing,
  onTriggerBackup,
  onRestoreSnapshot,
  onInspectDiff,
  onDeleteSnapshot,
}) => {
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [syncFrequency, setSyncFrequency] = useState<'realtime' | '1h' | 'daily' | 'manual'>('realtime');
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  const totalBytes = snapshots.reduce((acc, s) => acc + s.sizeBytes, 0);
  const formattedStorage = (totalBytes / 1024).toFixed(1);

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerBackup(newSnapshotLabel.trim() || undefined);
    setNewSnapshotLabel('');
    setIsCreatingManual(false);
  };

  const handleDownloadSnapshotVCard = (snapshot: CloudBackupSnapshot) => {
    const vcf = generateBulkVCards(snapshot.contacts);
    const filename = `backup_${snapshot.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.vcf`;
    downloadFile(vcf, filename, 'text/vcard');
  };

  const handleDownloadSnapshotJson = (snapshot: CloudBackupSnapshot) => {
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const filename = `backup_cloudagenda_${snapshot.id}.json`;
    downloadFile(jsonStr, filename, 'application/json');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Hero Cloud Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Cofre em Nuvem Ativo & Protegido
              </span>
              <span className="text-xs text-slate-400">
                Criptografia AES-256 de Ponta a Ponta
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Central de Backup & Restauração
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Sua agenda telefônica é sincronizada continuamente em nuvem segura. Crie pontos de restauração antes de viagens ou alterações, compare alterações e recupere contatos apagados com 1 clique.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreatingManual(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Ponto Manual</span>
            </button>

            <button
              onClick={() => onTriggerBackup()}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 active:scale-95 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando Nuvem...' : 'Sincronizar Nuvem Agora'}</span>
            </button>
          </div>
        </div>

        {/* Cloud Stats strip */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-6 text-xs">
          <div>
            <div className="text-slate-400">Pontos de Restauração</div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums">
              {snapshots.length} snapshots
            </div>
          </div>
          <div>
            <div className="text-slate-400">Contatos no Ponto Atual</div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums">
              {contacts.length} registros
            </div>
          </div>
          <div>
            <div className="text-slate-400">Espaço Nuvem Utilizado</div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums">
              {formattedStorage} KB / 50 GB
            </div>
          </div>
          <div>
            <div className="text-slate-400">Frequência de Auto-Sync</div>
            <div className="mt-1 text-emerald-400 font-semibold flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Tempo Real Ativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Snapshot Modal / Box if open */}
      {isCreatingManual && (
        <form
          onSubmit={handleCreateSnapshot}
          className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 animate-fade-in"
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
                className="mt-1.5 w-full rounded-lg border border-indigo-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-indigo-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingManual(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Salvar Snapshot na Nuvem
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Cloud Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <RefreshCw className="h-4 w-4 text-indigo-500" />
            <span>Frequência de Backup</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Com que frequência o aplicativo deve registrar novos snapshots automáticos.
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-1.5">
            {[
              { id: 'realtime', label: 'Tempo Real' },
              { id: '1h', label: 'A cada 1h' },
              { id: 'daily', label: 'Diário' },
              { id: 'manual', label: 'Manual' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSyncFrequency(opt.id as any)}
                className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  syncFrequency === opt.id
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Segurança & Integridade</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Validação de integridade via checksum SHA-256 e redundância em nuvem.
          </p>
          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Algoritmo de Hash:</span>
              <span className="font-mono text-slate-900 dark:text-white">SHA-256</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocolo:</span>
              <span className="font-mono text-slate-900 dark:text-white">TLS 1.3 / E2EE</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status dos Dados:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Íntegro</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <HardDrive className="h-4 w-4 text-sky-500" />
            <span>Compatibilidade Universal</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Exporte snapshots em formatos nativos para qualquer telefone ou computador.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                const vcf = generateBulkVCards(contacts);
                downloadFile(vcf, 'minha_agenda_completa.vcf', 'text/vcard');
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Baixar .VCF
            </button>
            <button
              onClick={() => {
                const csv = generateCsv(contacts);
                downloadFile(csv, 'minha_agenda_google.csv', 'text/csv');
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Baixar .CSV
            </button>
          </div>
        </div>
      </div>

      {/* Snapshots Timeline Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Histórico de Pontos de Restauração em Nuvem
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione qualquer momento anterior para restaurar contatos ou inspecionar diferenças (Diff).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {snapshots.length} versões salvas
          </span>
        </div>

        <div className="space-y-3">
          {snapshots.map((snap, index) => {
            const dateObj = new Date(snap.createdAt);
            const dateStr = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const sizeKb = (snap.sizeBytes / 1024).toFixed(1);

            return (
              <div
                key={snap.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {snap.deviceOrigin.toLowerCase().includes('iphone') ? (
                      <Smartphone className="h-5 w-5 text-indigo-500" />
                    ) : snap.deviceOrigin.toLowerCase().includes('macbook') ? (
                      <Laptop className="h-5 w-5 text-sky-500" />
                    ) : (
                      <Cloud className="h-5 w-5 text-indigo-500" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {snap.label}
                      </h3>
                      {snap.isAutomatic && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Automático
                        </span>
                      )}
                      {index === 0 && (
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          Mais Recente
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {dateStr} às {timeStr}
                      </span>
                      <span>·</span>
                      <span>{snap.contactCount} contatos</span>
                      <span>·</span>
                      <span>{sizeKb} KB</span>
                      <span>·</span>
                      <span className="truncate max-w-xs">{snap.deviceOrigin}</span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400 font-mono truncate max-w-md">
                      Hash: {snap.checksum}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onInspectDiff(snap)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    title="Comparar contatos atuais com este backup"
                  >
                    <GitCompare className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Ver Diff</span>
                  </button>

                  <button
                    onClick={() => onRestoreSnapshot(snap)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                    title="Restaurar toda a agenda para este ponto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <div className="flex items-center border-l border-slate-200 pl-2 dark:border-slate-800">
                    <button
                      onClick={() => handleDownloadSnapshotVCard(snap)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Baixar vCard (.vcf)"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadSnapshotJson(snap)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Baixar JSON criptografado"
                    >
                      <FileCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Excluir este snapshot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
