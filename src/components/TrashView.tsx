import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TrashItem } from '../utils/storage';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface TrashViewProps {
  trashItems: TrashItem[];
  onRestore: (contactId: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashItems,
  onRestore,
  onRestoreAll,
  onEmptyTrash,
}) => {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Lixeira de Contatos Protegida
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contatos apagados são preservados por 30 dias na nuvem com restauração a qualquer momento.
          </p>
        </div>

        {trashItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRestoreAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Todos ({trashItems.length})</span>
            </button>

            <button
              onClick={onEmptyTrash}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Esvaziar Lixeira</span>
            </button>
          </div>
        )}
      </div>

      {trashItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Trash2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            A Lixeira está vazia
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Nenhum contato foi excluído. Se você remover algum contato por engano, ele aparecerá aqui com contagem regressiva de 30 dias para recuperação.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trashItems.map(({ contact, deletedAt }) => {
            const dateStr = new Date(deletedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={contact.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {contact.name}
                    </span>
                    {contact.company && (
                      <span className="text-xs text-slate-400">· {contact.company}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      {formatPhoneNumber(contact.phones[0]?.number || '')}
                    </span>
                    <span>·</span>
                    <span>Excluído em {dateStr}</span>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Expira em 30 dias
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRestore(contact.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restaurar para Agenda</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
