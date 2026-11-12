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
  Flame,
} from 'lucide-react';
import {
  AppUser,
  loginWithFirebase,
  registerWithFirebase,
  isFirebaseConfigured,
} from '../firebase';

interface AuthScreenProps {
  onAuthSuccess: (user: AppUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setErrorMessage('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginWithFirebase(cleanEmail, password, rememberMe);
        onAuthSuccess(user);
      } else {
        const user = await registerWithFirebase(cleanEmail, password, name.trim(), rememberMe);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado. Alterne para a aba Entrar.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Formato de e-mail inválido.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Senha fraca. Utilize pelo menos 6 caracteres.');
      } else {
        setErrorMessage(err?.message || 'Falha ao autenticar no Firebase. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('vasconcelos.contabilidade@outlook.com');
    setPassword('Vasconcelos2026!#');
    setName('Vasconcelos Contabilidade');
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithFirebase('vasconcelos.contabilidade@outlook.com', 'Vasconcelos2026!#', true);
      onAuthSuccess(user);
    } catch {
      // Auto-register demo if not existing
      try {
        const user = await registerWithFirebase(
          'vasconcelos.contabilidade@outlook.com',
          'Vasconcelos2026!#',
          'Vasconcelos Contabilidade',
          true
        );
        onAuthSuccess(user);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Falha no acesso rápido.');
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
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 mb-3.5 transition-transform hover:scale-105 duration-300">
            <Cloud className="h-7 w-7 stroke-[2.2]" />
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
            Sincronização em tempo real de contatos com Cloud Firestore & Firebase Auth.
          </p>

          {/* Cloud engine status badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>Nuvem Ativa:</span>
            <span className="font-semibold">
              {isFirebaseConfigured ? 'Firebase Firestore (Produção)' : 'Firebase E2EE Ready'}
            </span>
          </div>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="mt-5 flex rounded-xl border border-slate-200/60 bg-slate-100/70 p-1 dark:border-white/[0.06] dark:bg-white/[0.04]">
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
            Entrar
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
            Criar Conta
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-slide-up">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou Razão Social"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox (Mandatory requirement) */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Lembrar meu login neste dispositivo
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Autenticando no Firebase...</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Acessar Minha Agenda' : 'Criar Conta e Sincronizar'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Preencher Dados da Conta (Vasconcelos Contabilidade)</span>
          </button>
        </div>

        {/* Security footer info */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Sessão permanente via browserLocalPersistence</span>
        </div>
      </div>
    </div>
  );
};
