import React from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Building,
  Tag,
  FileText,
  Star,
  ShieldAlert,
  QrCode,
  Download,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Contact } from '../types/contact';
import { formatPhoneNumber, getWhatsAppUrl, getTelUrl, getSmsUrl } from '../utils/phoneFormatter';
import { generateVCard, downloadFile } from '../utils/vcard';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
  onOpenQr: (contact: Contact) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenQr,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!contact) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadVCard = () => {
    const vcf = generateVCard(contact);
    const safeName = contact.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(vcf, `${safeName}.vcf`, 'text/vcard');
  };

  const primaryPhone = contact.phones[0]?.number || '';
  const primaryEmail = contact.emails[0]?.email || '';

  const getPhoneTypeLabel = (type: string) => {
    switch (type) {
      case 'mobile':
        return 'Celular';
      case 'whatsapp':
        return 'WhatsApp';
      case 'work':
        return 'Comercial';
      case 'home':
        return 'Residencial';
      default:
        return 'Outro';
    }
  };

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case 'work':
        return 'Corporativo';
      case 'personal':
        return 'Pessoal';
      default:
        return 'Principal';
    }
  };

  // Birthday calculation
  let birthdayInfo = '';
  if (contact.birthday) {
    const [year, month, day] = contact.birthday.split('-').map(Number);
    if (year && month && day) {
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      birthdayInfo = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year} (${age} anos)`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(contact.id)}
              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                contact.isFavorite ? 'text-amber-500' : 'text-slate-400'
              }`}
              title={contact.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Star className={`h-5 w-5 ${contact.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cartão de Contato
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVCard}
              title="Baixar vCard (.vcf) para este contato"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>vCard</span>
            </button>

            <button
              onClick={() => onOpenQr(contact)}
              title="QR Code para celular"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Code</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Profile Banner */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md dark:border-slate-800"
                />
              ) : (
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr ${
                    contact.avatarColor || 'from-indigo-600 to-sky-600'
                  } text-2xl font-bold text-white shadow-md`}
                >
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {contact.name}
                </h2>
                {contact.nickname && (
                  <span className="text-sm text-slate-400 font-normal">
                    "{contact.nickname}"
                  </span>
                )}
                {contact.isEmergencyIce && (
                  <span className="flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Emergência ICE
                  </span>
                )}
              </div>

              {(contact.jobTitle || contact.company) && (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <Building className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {contact.tags.map((tag, idx) => (
                    <React.Fragment key={tag}>
                      {idx > 0 && <span>·</span>}
                      <span>{tag}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Communication Actions Bar */}
          <div className="mt-6 grid grid-cols-4 gap-2.5">
            {primaryPhone && (
              <>
                <a
                  href={getWhatsAppUrl(primaryPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs font-semibold">WhatsApp</span>
                </a>

                <a
                  href={getTelUrl(primaryPhone)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-xs font-semibold">Ligar</span>
                </a>

                <a
                  href={getSmsUrl(primaryPhone)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-semibold">SMS</span>
                </a>
              </>
            )}

            {primaryEmail && (
              <a
                href={`mailto:${primaryEmail}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-sky-700 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs font-semibold">E-mail</span>
              </a>
            )}
          </div>
        </div>

        {/* Detailed Fields Section */}
        <div className="border-t border-slate-100 px-6 py-5 space-y-4 dark:border-slate-800">
          {/* Phone Numbers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Telefones
            </h4>
            <div className="mt-2 space-y-2">
              {contact.phones.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                        {formatPhoneNumber(p.number)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {getPhoneTypeLabel(p.type)} {p.isPrimary ? '· Principal' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(p.number, `phone-${idx}`)}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 dark:hover:bg-slate-700 transition-colors"
                      title="Copiar número"
                    >
                      {copiedField === `phone-${idx}` ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={getWhatsAppUrl(p.number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 dark:hover:bg-emerald-950 transition-colors"
                      title="Abrir no WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Addresses */}
          {contact.emails.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                E-mails
              </h4>
              <div className="mt-2 space-y-2">
                {contact.emails.map((e, idx) => (
                  <div
                    key={e.id || idx}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {e.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getEmailTypeLabel(e.type)} {e.isPrimary ? '· Principal' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(e.email, `email-${idx}`)}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 dark:hover:bg-slate-700 transition-colors"
                      title="Copiar e-mail"
                    >
                      {copiedField === `email-${idx}` ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Postal Address */}
          {contact.address && (contact.address.street || contact.address.city) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Endereço
              </h4>
              <div className="mt-2 flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="text-slate-700 dark:text-slate-300">
                    <div>{contact.address.street}</div>
                    <div className="text-xs text-slate-500">
                      {[contact.address.city, contact.address.state, contact.address.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    [contact.address.street, contact.address.city, contact.address.state].join(' ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <span>Mapa</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Birthday */}
          {birthdayInfo && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Aniversário
              </h4>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-mono tabular-nums">{birthdayInfo}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notas & Observações
              </h4>
              <div className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                {contact.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Edit & Delete */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => {
              onDelete(contact);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Mover para Lixeira</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onEdit(contact);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Editar Contato</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
