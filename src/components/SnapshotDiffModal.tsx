import React from 'react';
import {
  X,
  GitCompare,
  PlusCircle,
  MinusCircle,
  Edit3,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Contact, CloudBackupSnapshot } from '../types/contact';
import { computeSnapshotDiff } from '../utils/storage';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface SnapshotDiffModalProps {
  snapshot: CloudBackupSnapshot | null;
  currentContacts: Contact[];
  onClose: () => void;
  onConfirmRestore: (snapshot: CloudBackupSnapshot) => void;
}

export const SnapshotDiffModal: React.FC<SnapshotDiffModalProps> = ({
  snapshot,
  currentContacts,
  onClose,
  onConfirmRestore,
}) => {
  if (!snapshot) return null;

  const diff = computeSnapshotDiff(currentContacts, snapshot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Comparativo de Alterações (Diff)
              </h3>
              <p className="text-xs text-slate-500">
                Ponto de restauração: <span className="font-semibold">{snapshot.label}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Diff Summary Cards */}
        <div className="grid grid-cols-4 gap-3 border-b border-slate-100 p-6 dark:border-slate-800 text-center">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
            <div className="text-emerald-700 dark:text-emerald-400 text-xl font-bold font-mono tabular-nums">
              +{diff.added.length}
            </div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500">
              Novos (Criados depois)
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950 dark:bg-rose-950/20">
            <div className="text-rose-700 dark:text-rose-400 text-xl font-bold font-mono tabular-nums">
              -{diff.removed.length}
            </div>
            <div className="text-[11px] font-medium text-rose-600 dark:text-rose-500">
              Apagados (Na nuvem)
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-950 dark:bg-amber-950/20">
            <div className="text-amber-700 dark:text-amber-400 text-xl font-bold font-mono tabular-nums">
              ~{diff.modified.length}
            </div>
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-500">
              Modificados
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-slate-700 dark:text-slate-300 text-xl font-bold font-mono tabular-nums">
              ={diff.unchanged.length}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Idênticos
            </div>
          </div>
        </div>

        {/* Detailed Diff Sections */}
        <div className="p-6 space-y-6">
          {/* Removed contacts in current that WILL be recovered */}
          {diff.removed.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">
                <MinusCircle className="h-4 w-4" />
                <span>Serão RECUPERADOS da nuvem ({diff.removed.length})</span>
              </div>
              <div className="space-y-1.5 rounded-lg border border-rose-100 bg-rose-50/30 p-3 dark:border-rose-950 dark:bg-rose-950/10">
                {diff.removed.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatPhoneNumber(c.phones[0]?.number || '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added contacts in current that will be rolled back unless preserved */}
          {diff.added.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                <PlusCircle className="h-4 w-4" />
                <span>Contatos criados recentemente (não existem neste ponto) ({diff.added.length})</span>
              </div>
              <div className="space-y-1.5 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 dark:border-emerald-950 dark:bg-emerald-950/10">
                {diff.added.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatPhoneNumber(c.phones[0]?.number || '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified contacts */}
          {diff.modified.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                <Edit3 className="h-4 w-4" />
                <span>Contatos com dados modificados ({diff.modified.length})</span>
              </div>
              <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3 dark:border-amber-950 dark:bg-amber-950/10">
                {diff.modified.map(({ current, snapshot }) => (
                  <div key={current.id} className="text-xs border-b border-amber-100/60 pb-2 last:border-none">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {current.name}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="text-slate-500">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Atual: </span>
                        {formatPhoneNumber(current.phones[0]?.number || '')} · {current.company || 'Sem empresa'}
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400">
                        <span className="font-medium">No Snapshot: </span>
                        {formatPhoneNumber(snapshot.phones[0]?.number || '')} · {snapshot.company || 'Sem empresa'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                Nenhuma diferença encontrada
              </div>
              <div className="text-xs mt-1">
                Sua agenda atual é 100% idêntica a este ponto de restauração em nuvem.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              onConfirmRestore(snapshot);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restaurar Esta Versão Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
