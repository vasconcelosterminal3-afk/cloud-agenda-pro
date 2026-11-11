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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/[0.06] bg-[#FBFBFC]/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Comparativo de Alterações (Diff)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ponto de restauração: <span className="font-semibold text-slate-700 dark:text-slate-300">{snapshot.label}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diff Summary Cards */}
        <div className="grid grid-cols-4 gap-3 border-b border-slate-100 p-6 dark:border-white/[0.06] text-center">
          <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/40 p-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/[0.04]">
            <div className="text-emerald-600 dark:text-emerald-400 text-xl font-bold font-mono tabular-nums">
              +{diff.added.length}
            </div>
            <div className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Novos (Criados depois)
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100/80 bg-rose-50/40 p-3.5 dark:border-rose-500/10 dark:bg-rose-500/[0.04]">
            <div className="text-rose-600 dark:text-rose-400 text-xl font-bold font-mono tabular-nums">
              -{diff.removed.length}
            </div>
            <div className="text-[11px] font-medium text-rose-700/80 dark:text-rose-400/80 mt-0.5">
              Apagados (Na nuvem)
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100/80 bg-amber-50/40 p-3.5 dark:border-amber-500/10 dark:bg-amber-500/[0.04]">
            <div className="text-amber-600 dark:text-amber-400 text-xl font-bold font-mono tabular-nums">
              ~{diff.modified.length}
            </div>
            <div className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Modificados
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#F9FAFB] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="text-slate-700 dark:text-slate-300 text-xl font-bold font-mono tabular-nums">
              ={diff.unchanged.length}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Idênticos
            </div>
          </div>
        </div>

        {/* Detailed Diff Sections */}
        <div className="p-6 space-y-6">
          {/* Removed contacts in current that WILL be recovered */}
          {diff.removed.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2.5">
                <MinusCircle className="h-4 w-4" />
                <span>Serão RECUPERADOS da nuvem ({diff.removed.length})</span>
              </div>
              <div className="space-y-1.5 rounded-2xl border border-rose-100/70 bg-rose-50/20 p-3.5 dark:border-rose-500/10 dark:bg-rose-500/[0.03]">
                {diff.removed.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-rose-100/40 dark:border-rose-500/10 last:border-none">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {c.name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
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
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2.5">
                <PlusCircle className="h-4 w-4" />
                <span>Contatos criados recentemente (não existem neste ponto) ({diff.added.length})</span>
              </div>
              <div className="space-y-1.5 rounded-2xl border border-emerald-100/70 bg-emerald-50/20 p-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/[0.03]">
                {diff.added.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-emerald-100/40 dark:border-emerald-500/10 last:border-none">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {c.name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
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
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2.5">
                <Edit3 className="h-4 w-4" />
                <span>Contatos com dados modificados ({diff.modified.length})</span>
              </div>
              <div className="space-y-2 rounded-2xl border border-amber-100/70 bg-amber-50/20 p-3.5 dark:border-amber-500/10 dark:bg-amber-500/[0.03]">
                {diff.modified.map(({ current, snapshot }) => (
                  <div key={current.id} className="text-xs border-b border-amber-100/50 dark:border-amber-500/10 pb-2.5 last:border-none">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {current.name}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="text-slate-500 dark:text-slate-400">
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
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sua agenda atual é 100% idêntica a este ponto de restauração em nuvem.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-[#FBFBFC]/70 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200/80 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06] transition-all duration-300"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              onConfirmRestore(snapshot);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Esta Versão Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
