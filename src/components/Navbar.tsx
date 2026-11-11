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
  LogOut,
  User,
} from 'lucide-react';
import { CloudUser } from '../services/cloudDatabase';

interface NavbarProps {
  user: CloudUser | null;
  onLogout: () => void;
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
  user,
  onLogout,
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
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden border-b border-slate-100/90 bg-white/85 px-4 sm:px-6 py-3 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.06] dark:bg-[#0A0D14]/85">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 sm:gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('contacts')}
            className="group flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none transition-transform duration-300 hover:opacity-90"
          >
            <div className="relative flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-500/25 transition-all duration-300 group-hover:scale-105">
              <Cloud className="h-4 sm:h-4.5 w-4 sm:w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  CloudAgenda
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold tracking-wider text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  PRO
                </span>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate max-w-[130px] sm:max-w-none">
                Nuvem & Sync E2EE
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-100/70 p-1 border border-slate-200/40 dark:bg-white/[0.04] dark:border-white/[0.06]">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'backups'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cloud className="h-3.5 w-3.5 opacity-80" />
            <span>Backups</span>
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'duplicates'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
            <span>Otimizador</span>
            {duplicateCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                {duplicateCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'devices'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 opacity-80" />
            <span>Aparelhos</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeTab === 'trash'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50 dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 opacity-80" />
            <span>Lixeira</span>
            {trashCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200/70 px-1 text-[9px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {trashCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: User Pill, Tools & CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Account Pill */}
          {user && (
            <div
              title={`Conectado como: ${user.email}`}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 max-w-[160px] truncate"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-[11px] font-medium">{user.email.split('@')[0]}</span>
            </div>
          )}

          {/* Secret Vault Toggle */}
          <button
            onClick={onToggleVault}
            title={isVaultUnlocked ? 'Cofre Secreto Desbloqueado' : 'Desbloquear Cofre com PIN'}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
              isVaultUnlocked
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400'
                : 'border-slate-200/60 bg-white text-slate-600 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300'
            }`}
          >
            {isVaultUnlocked ? (
              <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            )}
            <span className="hidden xl:inline">
              {isVaultUnlocked ? 'Cofre Aberto' : 'Cofre PIN'}
            </span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 transition-all duration-200 hover:-translate-y-0.5"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Secondary CTA: + Novo Contato */}
          <button
            onClick={onNewContact}
            className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Novo</span>
          </button>

          {/* Primary CTA: Backup na Nuvem */}
          <button
            onClick={onInstantBackup}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 active:scale-98 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Salvando...' : 'Backup'}</span>
          </button>

          {/* Logout Button */}
          {user && (
            <button
              onClick={onLogout}
              title={`Sair da conta (${user.email})`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-400 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Tab Bar (Scrollable without overflow) */}
      <div className="lg:hidden mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'contacts'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <Users className="h-3 w-3" />
          <span>Contatos</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'backups'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <Cloud className="h-3 w-3" />
          <span>Backups</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'duplicates'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Otimizador</span>
          {duplicateCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1 text-[9px] font-bold text-amber-600">
              {duplicateCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'devices'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <Smartphone className="h-3 w-3" />
          <span>Aparelhos</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'trash'
              ? 'bg-indigo-600 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <Trash2 className="h-3 w-3" />
          <span>Lixeira</span>
          {trashCount > 0 && (
            <span className="rounded-full bg-slate-200 px-1 text-[9px] font-semibold text-slate-700">
              {trashCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
