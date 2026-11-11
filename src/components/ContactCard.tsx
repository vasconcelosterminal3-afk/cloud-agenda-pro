import React from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  Star,
  QrCode,
  ShieldAlert,
  Building,
  MoreVertical,
  Check,
} from 'lucide-react';
import { Contact } from '../types/contact';
import { formatPhoneNumber, getWhatsAppUrl, getTelUrl } from '../utils/phoneFormatter';

interface ContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contactId: string, selected: boolean) => void;
  onOpenDetails: (contact: Contact) => void;
  onOpenQr: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
  onDelete: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isSelected,
  onSelect,
  onOpenDetails,
  onOpenQr,
  onToggleFavorite,
  onDelete,
}) => {
  const primaryPhone = contact.phones[0]?.number || '';
  const primaryEmail = contact.emails[0]?.email || '';
  const formattedPhone = formatPhoneNumber(primaryPhone);
  const whatsappUrl = getWhatsAppUrl(primaryPhone);
  const telUrl = getTelUrl(primaryPhone);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-slate-900 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-500'
          : 'border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Row: Selection, Star, Actions */}
      <div className="flex items-start justify-between gap-3">
        {/* Selection Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(contact.id, !isSelected);
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            isSelected
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-slate-300 bg-white text-transparent hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800'
          }`}
          aria-label={isSelected ? 'Desmarcar contato' : 'Selecionar contato'}
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </button>

        {/* Favorite & Emergency Indicators */}
        <div className="flex items-center gap-1.5">
          {contact.isEmergencyIce && (
            <span
              title="Contato de Emergência (ICE - In Case of Emergency)"
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>ICE</span>
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(contact.id);
            }}
            className={`p-1 transition-colors ${
              contact.isFavorite
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-500 dark:text-slate-700 dark:hover:text-amber-400'
            }`}
            title={contact.isFavorite ? 'Remover dos favoritos' : 'Favoritar contato'}
          >
            <Star className={`h-4 w-4 ${contact.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Identity: Avatar + Names */}
      <div
        onClick={() => onOpenDetails(contact)}
        className="mt-2 flex cursor-pointer items-center gap-3.5"
      >
        <div className="relative shrink-0">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
            />
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr ${
                contact.avatarColor || 'from-indigo-600 to-sky-600'
              } text-sm font-bold text-white shadow-sm`}
            >
              {getInitials(contact.name)}
            </div>
          )}

          {contact.isVaultSecret && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white font-bold shadow">
              🔒
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
              {contact.name}
            </h3>
            {contact.nickname && (
              <span className="truncate text-xs text-slate-400">
                ({contact.nickname})
              </span>
            )}
          </div>

          {(contact.jobTitle || contact.company) && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              <Building className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">
                {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Points: Phone & Email */}
      <div className="mt-3.5 space-y-1 text-xs">
        {formattedPhone ? (
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 font-mono tabular-nums truncate">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{formattedPhone}</span>
            </div>
            {contact.phones.length > 1 && (
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                +{contact.phones.length - 1}
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-400 italic">Sem telefone cadastrado</div>
        )}

        {primaryEmail && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{primaryEmail}</span>
          </div>
        )}
      </div>

      {/* Tags line (Zero-pill text styling) */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {contact.tags.map((tag, idx) => (
            <React.Fragment key={tag}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <span className="truncate">{tag}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Quick Action Footer: WhatsApp, Call, QR Code, View Details */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
        <div className="flex items-center gap-1">
          {primaryPhone && (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Conversar no WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </a>

              <a
                href={telUrl}
                onClick={(e) => e.stopPropagation()}
                title="Ligar agora"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQr(contact);
            }}
            title="Escanear QR Code para salvar no celular"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <QrCode className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => onOpenDetails(contact)}
          className="text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          Ver detalhes →
        </button>
      </div>
    </div>
  );
};
