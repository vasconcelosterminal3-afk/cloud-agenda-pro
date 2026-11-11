import React from 'react';
import {
  Cloud,
  Users,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Smartphone,
  Lock,
  Unlock,
  Sun,
  Moon,
  Sparkles,
  Plus,
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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('contacts')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-sm shadow-indigo-500/20">
            <Cloud className="h-5 w-5 transition-transform group-hover:scale-105" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                CloudAgenda
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Backup & Sync em Nuvem
            </div>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links (4-5 single-line clean text links with hover) */}
      <nav className="hidden lg:flex items-center gap-1">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'contacts'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Contatos</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'backups'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Cloud className="h-4 w-4" />
          <span>Backups em Nuvem</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'duplicates'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Otimizador & Duplicados</span>
          {duplicateCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {duplicateCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'devices'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Dispositivos</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'trash'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          <span>Lixeira</span>
          {trashCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {trashCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Vault PIN toggle */}
        <button
          onClick={onToggleVault}
          title={isVaultUnlocked ? 'Cofre Secreto Desbloqueado' : 'Desbloquear Cofre com PIN'}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            isVaultUnlocked
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
          }`}
        >
          {isVaultUnlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">
            {isVaultUnlocked ? 'Cofre Ativo' : 'Cofre PIN'}
          </span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Primary Action Button: Fazer Backup */}
        <button
          onClick={onInstantBackup}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Salvando...' : 'Backup na Nuvem'}</span>
        </button>

        {/* New Contact Button */}
        <button
          onClick={onNewContact}
          className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Contato</span>
        </button>
      </div>
    </header>
  );
};
