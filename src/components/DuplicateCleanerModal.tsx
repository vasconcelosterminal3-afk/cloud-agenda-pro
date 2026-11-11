import React from 'react';
import {
  Sparkles,
  GitMerge,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  UserCheck,
  ShieldCheck,
  X,
  ArrowRight,
  UserX,
} from 'lucide-react';
import { Contact, DuplicateGroup } from '../types/contact';
import { scanDuplicates, smartMergeContacts, analyzeContactHealth } from '../utils/duplicateScanner';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface DuplicateCleanerModalProps {
  contacts: Contact[];
  onApplyMerges: (mergedContacts: Contact[]) => void;
  onClose: () => void;
  onEditContact: (contact: Contact) => void;
}

export const DuplicateCleanerModal: React.FC<DuplicateCleanerModalProps> = ({
  contacts,
  onApplyMerges,
  onClose,
  onEditContact,
}) => {
  const duplicateGroups = scanDuplicates(contacts);
  const healthReport = analyzeContactHealth(contacts);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const handleMergeGroup = (group: DuplicateGroup) => {
    const toMerge = group.contactIds
      .map((id) => contactMap.get(id))
      .filter(Boolean) as Contact[];

    if (toMerge.length < 2) return;

    const merged = smartMergeContacts(toMerge);
    const idsToRemove = new Set(group.contactIds);
    const remaining = contacts.filter((c) => !idsToRemove.has(c.id));
    onApplyMerges([merged, ...remaining]);
  };

  const handleMergeAll = () => {
    let currentPool = [...contacts];

    duplicateGroups.forEach((group) => {
      const toMerge = group.contactIds
        .map((id) => currentPool.find((c) => c.id === id))
        .filter(Boolean) as Contact[];

      if (toMerge.length >= 2) {
        const merged = smartMergeContacts(toMerge);
        const idsToRemove = new Set(group.contactIds);
        currentPool = [merged, ...currentPool.filter((c) => !idsToRemove.has(c.id))];
      }
    });

    onApplyMerges(currentPool);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/10 dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4.5 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Otimizador & Limpeza Inteligente de Agenda
              </h3>
              <p className="text-[11px] text-slate-400">
                Detecção avançada de contatos repetidos, telefones duplicados e auditoria de saúde.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Health Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-100/80 dark:border-white/[0.06] bg-[#F9FAFB]/70 dark:bg-white/[0.02]">
          <div className="rounded-2xl border border-slate-100/90 bg-white p-4.5 dark:border-white/[0.06] dark:bg-[#111622] shadow-2xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Índice de Otimização</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                {healthReport.score}%
              </span>
              <span className="text-[11px] text-slate-400">Score de Saúde</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100/90 bg-white p-4.5 dark:border-white/[0.06] dark:bg-[#111622] shadow-2xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Duplicados Identificados</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {duplicateGroups.length} grupos
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100/90 bg-white p-4.5 dark:border-white/[0.06] dark:bg-[#111622] shadow-2xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contatos sem Telefone</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {healthReport.noPhoneCount} registros
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100/90 bg-white p-4.5 dark:border-white/[0.06] dark:bg-[#111622] shadow-2xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Perfis 100% Completos</div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {healthReport.completeProfilesCount} contatos
            </div>
          </div>
        </div>

        {/* Duplicates List */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Contatos Duplicados ({duplicateGroups.length})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                A fusão inteligente preserva todos os números, e-mails, notas e tags em um único contato.
              </p>
            </div>

            {duplicateGroups.length > 0 && (
              <button
                onClick={handleMergeAll}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto"
              >
                <GitMerge className="h-4 w-4" />
                <span>Mesclar Todos ({duplicateGroups.length}) com 1 Clique</span>
              </button>
            )}
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Agenda Livre de Duplicados!
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Nenhum telefone repetido, e-mail idêntico ou contato espelhado foi detectado na sua base.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateGroups.map((group) => {
                const groupContacts = group.contactIds
                  .map((id) => contactMap.get(id))
                  .filter(Boolean) as Contact[];

                return (
                  <div
                    key={group.id}
                    className="rounded-xl border border-amber-200/80 bg-amber-50/20 p-4 dark:border-amber-900/60 dark:bg-amber-950/10"
                  >
                    <div className="flex items-center justify-between gap-4 mb-3 border-b border-amber-100 pb-2.5 dark:border-amber-900/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span>{group.matchedValue}</span>
                      </div>
                      <button
                        onClick={() => handleMergeGroup(group)}
                        className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow-sm"
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                        <span>Mesclar Este Par</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupContacts.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">
                            {c.name}
                          </div>
                          {c.company && (
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {c.jobTitle ? `${c.jobTitle} em ` : ''}{c.company}
                            </div>
                          )}
                          <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {c.phones.map((p, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{formatPhoneNumber(p.number)}</span>
                              </div>
                            ))}
                            {c.emails.map((e, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="font-sans truncate">{e.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Health Issues & Incomplete Contacts */}
          {healthReport.issues.length > 0 && (
            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Avisos de Integridade & Pendências ({healthReport.issues.length})
              </h4>
              <div className="space-y-2">
                {healthReport.issues.slice(0, 5).map((issue, idx) => {
                  const target = contactMap.get(issue.contactId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-850"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserX className="h-4 w-4 text-rose-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {issue.contactName}
                          </span>
                          <span className="text-slate-500 ml-2">· {issue.message}</span>
                        </div>
                      </div>

                      {target && (
                        <button
                          onClick={() => {
                            onClose();
                            onEditContact(target);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          Completar Cadastro →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
