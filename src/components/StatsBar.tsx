import React from 'react';
import {
  HardDrive,
  Users,
  Sparkles,
  FileUp,
  FileDown,
  RotateCcw,
  CloudCheck,
  ShieldCheck,
} from 'lucide-react';

interface StatsBarProps {
  totalContacts: number;
  healthScore: number;
  duplicateCount: number;
  storageUsedBytes: number;
  lastSyncTime: string | null;
  cloudUserEmail?: string;
  onOpenImportExport: (tab: 'import' | 'export') => void;
  onResetDemo: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalContacts,
  healthScore,
  duplicateCount,
  storageUsedBytes,
  lastSyncTime,
  cloudUserEmail,
  onOpenImportExport,
  onResetDemo,
}) => {
  const formattedSize =
    storageUsedBytes < 1024
      ? `${storageUsedBytes} B`
      : `${(storageUsedBytes / 1024).toFixed(1)} KB`;

  return (
    <div className="w-full max-w-full overflow-hidden border-b border-slate-100 bg-[#F9FAFB]/95 px-4 sm:px-6 py-2.5 dark:border-white/[0.05] dark:bg-[#0A0D14]/60 transition-colors">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Compact Pro Badges with flex-wrap and responsive wrap */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Badge: Nuvem Criptografada & Status */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap">Nuvem E2EE</span>
            <span className="text-[10px] opacity-75 font-mono hidden xs:inline">(AES-256)</span>
          </div>

          {/* Badge: Saúde da Agenda */}
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="whitespace-nowrap">Saúde:</span>
            <span className="font-semibold font-mono tabular-nums">{healthScore}%</span>
            {duplicateCount > 0 && (
              <span className="ml-0.5 rounded bg-amber-500/15 px-1 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                {duplicateCount} dup
              </span>
            )}
          </div>

          {/* Badge: Total Contatos */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-300 shadow-2xs">
            <Users className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalContacts}
            </span>
            <span className="hidden xs:inline">contatos</span>
          </div>

          {/* Badge: Armazenamento */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
            <HardDrive className="h-3 w-3 text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="font-mono tabular-nums">{formattedSize}</span>
            <span className="opacity-60 text-[11px]">/ 50 GB</span>
          </div>
        </div>

        {/* Compact Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onOpenImportExport('import')}
            className="flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white px-2.5 sm:px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5"
          >
            <FileUp className="h-3 w-3 text-slate-400" />
            <span>Importar</span>
          </button>

          <button
            onClick={() => onOpenImportExport('export')}
            className="flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white px-2.5 sm:px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5"
          >
            <FileDown className="h-3 w-3 text-slate-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={onResetDemo}
            title="Recarregar dados de demonstração nesta conta"
            className="flex items-center gap-1 rounded-xl border border-transparent px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3 w-3 opacity-70" />
            <span className="hidden md:inline">Restaurar Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
