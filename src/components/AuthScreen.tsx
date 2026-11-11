import React, { useState } from 'react';
import {
  Cloud,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Database,
} from 'lucide-react';
import { CloudUser, loginWithEmail, registerWithEmail, getCloudEngineStatus } from '../services/cloudDatabase';

interface AuthScreenProps {
  onAuthSuccess: (user: CloudUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const engineStatus = getCloudEngineStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        onAuthSuccess(user);
      } else {
        const user = await registerWithEmail(email, password, name);
        onAuthSuccess(user);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('demo@cloudagenda.pro');
    setPassword('senha1234');
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithEmail('demo@cloudagenda.pro', 'senha1234');
      onAuthSuccess(user);
    } catch {
      // Auto-register demo if not exists
      try {
        const user = await registerWithEmail('demo@cloudagenda.pro', 'senha1234', 'Usuário Demo Pro');
        onAuthSuccess(user);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Falha ao acessar modo demo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#F9FAFB] text-slate-800 dark:bg-[#090C10] dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

      {/* Main Auth Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/50 dark:border-white/[0.08] dark:bg-[#0E121B] dark:shadow-none animate-fade-in">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 mb-4 transition-transform hover:scale-105 duration-300">
            <Cloud className="h-6 w-6 stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              CloudAgenda
            </h1>
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              PRO
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Backup, restauração e sincronização segura de contatos em nuvem criptografada.
          </p>

          {/* Cloud engine status badge */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Database className="h-3 w-3 text-emerald-500" />
            <span>Nuvem Ativa:</span>
            <span className="font-semibold">{engineStatus.name}</span>
          </div>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="mt-6 flex rounded-xl border border-slate-200/60 bg-slate-100/70 p-1 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Acessar Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/60 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo ou Apelido
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:hover:border-white/[0.14] transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              E-mail da Conta na Nuvem
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:hover:border-white/[0.14] transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo de 6 caracteres' : 'Sua senha segura'}
                className="w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:hover:border-white/[0.14] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Conectando à Nuvem...</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Entrar e Sincronizar Agenda' : 'Criar Conta e Iniciar Nuvem'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider & Quick Demo Access */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-white/[0.06]" />
          </div>
          <span className="relative bg-white px-2.5 text-[11px] text-slate-400 dark:bg-[#0E121B]">
            ou para demonstração imediata
          </span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-[#F9FAFB] py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100/80 hover:text-indigo-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition-all duration-300 hover:-translate-y-0.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Acesso Rápido Demo (demo@cloudagenda.pro)</span>
        </button>

        {/* Footer Security Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Criptografia E2EE AES-256</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Isolamento por ID do E-mail</span>
          </div>
        </div>
      </div>
    </div>
  );
};
