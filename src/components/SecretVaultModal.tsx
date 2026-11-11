import React, { useState } from 'react';
import { X, Lock, Unlock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getVaultPin, setVaultPin } from '../utils/storage';

interface SecretVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onLockVault: () => void;
}

export const SecretVaultModal: React.FC<SecretVaultModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockSuccess,
  onLockVault,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentSavedPin = getVaultPin();

  const handleKeyClick = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg('');

      if (next.length === 4) {
        if (next === currentSavedPin) {
          onUnlockSuccess();
          setPinInput('');
          onClose();
        } else {
          setErrorMsg('PIN incorreto. Tente novamente (padrão: 1234).');
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
    setErrorMsg('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMsg('O novo PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }
    setVaultPin(newPin);
    setSuccessMsg('PIN do cofre atualizado com sucesso!');
    setNewPin('');
    setIsChangingPin(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Cofre Secreto de Contatos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isUnlocked ? (
          /* Vault is already unlocked state */
          <div className="my-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Unlock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cofre Desbloqueado
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Contatos confidenciais marcados como secretos estão visíveis na sua agenda.
              </p>
            </div>

            {isChangingPin ? (
              <form onSubmit={handleChangePinSubmit} className="space-y-3 pt-2 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Novo PIN de 4 dígitos:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 5678"
                  className="w-full text-center text-lg font-mono tracking-widest rounded-lg border border-slate-200 p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Salvar PIN
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Alterar Senha PIN</span>
                </button>
                <button
                  onClick={() => {
                    onLockVault();
                    onClose();
                  }}
                  className="w-full rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white hover:bg-amber-500 shadow-sm"
                >
                  Trancar Cofre Agora
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Vault Locked: PIN Pad */
          <div className="my-5 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Digite o PIN do Cofre
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Senha padrão inicial: <span className="font-mono font-bold">1234</span>
              </p>
            </div>

            {/* PIN Dots Indicator */}
            <div className="flex items-center justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    pinInput.length > idx
                      ? 'border-indigo-600 bg-indigo-600 scale-110'
                      : 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 10-Key Pad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyClick(digit)}
                  className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-base font-semibold text-slate-800 hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all font-mono"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleKeyClick('0')}
                className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-base font-semibold text-slate-800 hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all font-mono"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-all"
              >
                ←
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
