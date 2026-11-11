import React from 'react';
import {
  ShieldCheck,
  HardDrive,
  Users,
  Sparkles,
  FileUp,
  FileDown,
  RotateCcw,
} from 'lucide-react';

interface StatsBarProps {
  totalContacts: number;
  healthScore: number;
  duplicateCount: number;
  storageUsedBytes: number;
  lastSyncTime: string | null;
  onOpenImportExport: (tab: 'import' | 'export') => void;
  onResetDemo: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalContacts,
  healthScore,
  duplicateCount,
  storageUsedBytes,
  lastSyncTime,
  onOpenImportExport,
  onResetDemo,
}) => {
  const formattedSize =
    storageUsedBytes < 1024
      ? `${storageUsedBytes} B`
      : `${(storageUsedBytes / 1024).toFixed(1)} KB`;

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Metric Strip with tabular numerals and clean separators */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums text-sm">
              {totalContacts}
            </span>
            <span>contatos salvos</span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-slate-900 dark:text-white">Nuvem Criptografada</span>
            <span className="text-[11px] text-slate-400 font-mono">(AES-256)</span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>Saúde da Agenda:</span>
            <span className={`font-semibold font-mono tabular-nums ${getHealthColor(healthScore)}`}>
              {healthScore}%
            </span>
            {duplicateCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                ({duplicateCount} duplicado{duplicateCount > 1 ? 's' : ''})
              </span>
            )}
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>

          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-slate-400" />
            <span>Armazenamento:</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
              {formattedSize}
            </span>
            <span className="text-slate-400">/ 50 GB</span>
          </div>
        </div>

        {/* Quick Utilities: Import, Export, Reset Demo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenImportExport('import')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <FileUp className="h-3.5 w-3.5 text-slate-500" />
            <span>Importar .vcf / CSV</span>
          </button>

          <button
            onClick={() => onOpenImportExport('export')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-500" />
            <span>Exportar</span>
          </button>

          <button
            onClick={onResetDemo}
            title="Restaurar dados padrão de demonstração"
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden md:inline">Restaurar Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
