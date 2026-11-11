import React from 'react';
import {
  Cloud,
  Users,
  Sparkles,
  Smartphone,
  Trash2,
  Lock,
  Unlock,
  Sun,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'contacts' | 'backups' | 'duplicates' | 'devices' | 'trash';
  setActiveTab: (tab: 'contacts' | 'backups' | 'duplicates' | 'devices' | 'trash') => void;
  onNewContact: () => void;
  onInstantBackup: () => void;
  isSyncing: boolean;
  isVaultUnlocked: boolean;
  onToggleVault: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  duplicateCount: number;
  trashCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewContact,
  onInstantBackup,
  isSyncing,
  isVaultUnlocked,
  onToggleVault,
  isDarkMode,
  onToggleDarkMode,
  duplicateCount,
  trashCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-white/80 px-6 py-3.5 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.06] dark:bg-[#0A0D14]/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        {/* Zone 1: Wordmark & Brand in Apple/Linear aesthetic */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('contacts')}
            className="group flex items-center gap-3 text-left focus:outline-none transition-transform duration-300 hover:opacity-90"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-500/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40">
              <Cloud className="h-4.5 w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  CloudAgenda
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Backup em Nuvem & Sync
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean pill segmented bar) */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-100/70 p-1 border border-slate-200/40 dark:bg-white/[0.04] dark:border-white/[0.06]">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'contacts'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5 opacity-80" />
            <span>Contatos</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'backups'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cloud className="h-3.5 w-3.5 opacity-80" />
            <span>Backups em Nuvem</span>
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'duplicates'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
            <span>Otimizador & Duplicados</span>
            {duplicateCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {duplicateCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'devices'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 opacity-80" />
            <span>Dispositivos</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'trash'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 opacity-80" />
            <span>Lixeira</span>
            {trashCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-slate-200/70 px-1.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {trashCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions & Micro-interactions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Secret Vault Toggle with subtle pill */}
          <button
            onClick={onToggleVault}
            title={isVaultUnlocked ? 'Cofre Secreto Desbloqueado' : 'Desbloquear Cofre com PIN'}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 ${
              isVaultUnlocked
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400'
                : 'border-slate-200/60 bg-white text-slate-600 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/[0.16]'
            }`}
          >
            {isVaultUnlocked ? (
              <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            )}
            <span className="hidden sm:inline">
              {isVaultUnlocked ? 'Cofre Aberto' : 'Cofre PIN'}
            </span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/[0.16] dark:hover:text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Secondary CTA: + Novo Contato */}
          <button
            onClick={onNewContact}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Contato</span>
          </button>

          {/* Primary High-Intent CTA: Electric Indigo */}
          <button
            onClick={onInstantBackup}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 active:scale-98 disabled:opacity-60 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Backup na Nuvem'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
