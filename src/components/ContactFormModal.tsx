import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Building,
  User,
  ShieldAlert,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import { Contact, PhoneNumber, EmailAddress, PhoneType, EmailType } from '../types/contact';
import { maskPhoneInput } from '../utils/phoneFormatter';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  initialContact?: Contact | null;
}

const DEFAULT_TAGS = ['Trabalho', 'Família', 'Amigos', 'Médicos', 'VIP', 'Clientes', 'Serviços'];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phones, setPhones] = useState<PhoneNumber[]>([
    { id: 'p_init_1', type: 'mobile', number: '', isPrimary: true },
  ]);
  const [emails, setEmails] = useState<EmailAddress[]>([
    { id: 'e_init_1', type: 'personal', email: '', isPrimary: true },
  ]);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tags, setTags] = useState<string[]>(['Trabalho']);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isEmergencyIce, setIsEmergencyIce] = useState(false);
  const [isVaultSecret, setIsVaultSecret] = useState(false);

  useEffect(() => {
    if (initialContact) {
      setName(initialContact.name || '');
      setNickname(initialContact.nickname || '');
      setCompany(initialContact.company || '');
      setJobTitle(initialContact.jobTitle || '');
      setPhones(
        initialContact.phones && initialContact.phones.length > 0
          ? initialContact.phones.map((p) => ({ ...p, number: maskPhoneInput(p.number) }))
          : [{ id: 'p_1', type: 'mobile', number: '', isPrimary: true }]
      );
      setEmails(
        initialContact.emails && initialContact.emails.length > 0
          ? initialContact.emails
          : [{ id: 'e_1', type: 'personal', email: '', isPrimary: true }]
      );
      setStreet(initialContact.address?.street || '');
      setCity(initialContact.address?.city || '');
      setState(initialContact.address?.state || '');
      setPostalCode(initialContact.address?.postalCode || '');
      setBirthday(initialContact.birthday || '');
      setTags(initialContact.tags || []);
      setNotes(initialContact.notes || '');
      setIsFavorite(initialContact.isFavorite || false);
      setIsEmergencyIce(initialContact.isEmergencyIce || false);
      setIsVaultSecret(initialContact.isVaultSecret || false);
    } else {
      // Reset form
      setName('');
      setNickname('');
      setCompany('');
      setJobTitle('');
      setPhones([{ id: 'p_new_1', type: 'mobile', number: '', isPrimary: true }]);
      setEmails([{ id: 'e_new_1', type: 'personal', email: '', isPrimary: true }]);
      setStreet('');
      setCity('');
      setState('');
      setPostalCode('');
      setBirthday('');
      setTags(['Trabalho']);
      setNotes('');
      setIsFavorite(false);
      setIsEmergencyIce(false);
      setIsVaultSecret(false);
    }
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const handleAddPhone = () => {
    setPhones([
      ...phones,
      {
        id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'mobile',
        number: '',
        isPrimary: false,
      },
    ]);
  };

  const handleRemovePhone = (index: number) => {
    if (phones.length <= 1) return;
    setPhones(phones.filter((_, i) => i !== index));
  };

  const handleUpdatePhone = (index: number, field: keyof PhoneNumber, val: any) => {
    const updated = [...phones];
    const finalVal = field === 'number' ? maskPhoneInput(val) : val;
    updated[index] = { ...updated[index], [field]: finalVal };
    setPhones(updated);
  };

  const handleAddEmail = () => {
    setEmails([
      ...emails,
      {
        id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'work',
        email: '',
        isPrimary: false,
      },
    ]);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length <= 1) return;
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleUpdateEmail = (index: number, field: keyof EmailAddress, val: any) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], [field]: val };
    setEmails(updated);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTag.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filteredPhones = phones.filter((p) => p.number.trim().length > 0);
    const filteredEmails = emails.filter((e) => e.email.trim().length > 0);

    const contactToSave: Contact = {
      id: initialContact?.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      company: company.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      avatarUrl: initialContact?.avatarUrl,
      avatarColor: initialContact?.avatarColor || 'from-indigo-600 to-sky-600',
      phones: filteredPhones.length > 0 ? filteredPhones : [{ id: 'p_def', type: 'mobile', number: '' }],
      emails: filteredEmails,
      address:
        street || city || state || postalCode
          ? {
              street: street.trim() || undefined,
              city: city.trim() || undefined,
              state: state.trim() || undefined,
              postalCode: postalCode.trim() || undefined,
              country: 'Brasil',
            }
          : undefined,
      birthday: birthday || undefined,
      tags: tags.length > 0 ? tags : ['Geral'],
      notes: notes.trim() || undefined,
      isFavorite,
      isEmergencyIce,
      isVaultSecret,
      createdAt: initialContact?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(contactToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/10 transition-all dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-6 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <User className="h-4.5 w-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {initialContact ? 'Editar Contato' : 'Adicionar Novo Contato'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Preencha os detalhes cadastrais e sincronize com a nuvem
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="mt-1.5 w-full rounded-xl border border-slate-200/70 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-[#090C10] dark:text-white transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Apelido
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Cadu"
                className="mt-1.5 w-full rounded-xl border border-slate-200/70 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-[#090C10] dark:text-white transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Empresa / Organização
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Apex Cloud Corp"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cargo / Função
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Diretor de Tecnologia"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Dynamic Phone Numbers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Números de Telefone</span>
              </label>
              <button
                type="button"
                onClick={handleAddPhone}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Telefone</span>
              </button>
            </div>

            <div className="space-y-2">
              {phones.map((phone, idx) => (
                <div key={phone.id || idx} className="flex items-center gap-2">
                  <select
                    value={phone.type}
                    onChange={(e) =>
                      handleUpdatePhone(idx, 'type', e.target.value as PhoneType)
                    }
                    className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="mobile">Celular</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="work">Comercial</option>
                    <option value="home">Residencial</option>
                    <option value="other">Outro</option>
                  </select>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={phone.number}
                    onChange={(e) => handleUpdatePhone(idx, 'number', e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remover telefone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Emails */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>Endereços de E-mail</span>
              </label>
              <button
                type="button"
                onClick={handleAddEmail}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar E-mail</span>
              </button>
            </div>

            <div className="space-y-2">
              {emails.map((em, idx) => (
                <div key={em.id || idx} className="flex items-center gap-2">
                  <select
                    value={em.type}
                    onChange={(e) =>
                      handleUpdateEmail(idx, 'type', e.target.value as EmailType)
                    }
                    className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="personal">Pessoal</option>
                    <option value="work">Corporativo</option>
                    <option value="other">Outro</option>
                  </select>

                  <input
                    type="email"
                    value={em.email}
                    onChange={(e) => handleUpdateEmail(idx, 'email', e.target.value)}
                    placeholder="Ex: contato@exemplo.com.br"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remover e-mail"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Endereço Residencial / Comercial</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua / Avenida, Número e Bairro"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Grupos e Tags</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {DEFAULT_TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleToggleTag(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    tags.includes(t)
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Adicionar nova tag..."
                className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                + Incluir
              </button>
            </div>
          </div>

          {/* Emergency ICE & Secret Vault Flags */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-850">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergencyIce}
                onChange={(e) => setIsEmergencyIce(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Contato de Emergência Médica (ICE)
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Fica visível em chamadas prioritárias e socorro imediato.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isVaultSecret}
                onChange={(e) => setIsVaultSecret(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Proteger no Cofre com Senha PIN
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Oculta este contato da lista principal quando o cofre estiver trancado.
                </span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas & Observações
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações pessoais, preferências, histórico ou informações adicionais..."
              className="w-full rounded-xl border border-slate-200/70 bg-white p-3 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-[#090C10] dark:text-white transition-all duration-300"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100/80 pt-4 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/70 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-all duration-300 hover:-translate-y-0.5"
            >
              {initialContact ? 'Salvar Alterações' : 'Criar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
