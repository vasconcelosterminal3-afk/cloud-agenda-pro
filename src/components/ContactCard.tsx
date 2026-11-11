import React from 'react';
import {
  Phone,
  MessageSquare,
  Mail,
  Star,
  QrCode,
  ShieldAlert,
  Building2,
  Check,
  ChevronRight,
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

// Sophisticated vibrant gradients for avatar initials (Vercel/Linear style)
const GRADIENT_PALETTES = [
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-blue-600 via-indigo-500 to-violet-500',
  'from-violet-600 via-purple-500 to-cyan-400',
  'from-rose-500 via-pink-500 to-amber-400',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-fuchsia-600 via-pink-500 to-rose-400',
  'from-sky-500 via-blue-600 to-indigo-600',
];

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

  // Deterministic vibrant gradient based on contact id/name hash
  const gradientClass = React.useMemo(() => {
    let hash = 0;
    const str = contact.id + contact.name;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % GRADIENT_PALETTES.length;
    return GRADIENT_PALETTES[idx];
  }, [contact.id, contact.name]);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#0E121B] ${
        isSelected
          ? 'border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20 dark:border-indigo-500/80'
          : 'border-slate-100/90 hover:border-slate-200/80 shadow-xs hover:shadow-slate-200/40 dark:border-white/[0.06] dark:hover:border-white/[0.14] dark:hover:shadow-black/50'
      }`}
    >
      {/* Top Row: Multi-selection checkbox & High-priority badges */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(contact.id, !isSelected);
          }}
          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
            isSelected
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-slate-200 bg-white text-transparent hover:border-slate-300 dark:border-white/20 dark:bg-white/[0.04]'
          }`}
          aria-label={isSelected ? 'Desmarcar' : 'Selecionar'}
        >
          <Check className="h-3 w-3 stroke-[3]" />
        </button>

        <div className="flex items-center gap-1.5">
          {contact.isEmergencyIce && (
            <span
              title="Contato de Emergência Médica (ICE)"
              className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400"
            >
              <ShieldAlert className="h-3 w-3" />
              <span>ICE</span>
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(contact.id);
            }}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              contact.isFavorite
                ? 'text-amber-400'
                : 'text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400'
            }`}
            title={contact.isFavorite ? 'Remover dos favoritos' : 'Favoritar contato'}
          >
            <Star className={`h-4 w-4 ${contact.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Identity: Avatar with vibrant gradient + Name */}
      <div
        onClick={() => onOpenDetails(contact)}
        className="mt-2.5 flex cursor-pointer items-center gap-3.5"
      >
        <div className="relative shrink-0">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/80 dark:ring-slate-800 shadow-sm"
            />
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr ${gradientClass} text-xs font-bold text-white shadow-sm tracking-wider`}
            >
              {getInitials(contact.name)}
            </div>
          )}

          {contact.isVaultSecret && (
            <div
              title="Contato Secreto com PIN"
              className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white font-bold ring-2 ring-white dark:ring-[#0E121B]"
            >
              🔒
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
              {contact.name}
            </h3>
            {contact.nickname && (
              <span className="truncate text-xs text-slate-400 font-normal">
                ({contact.nickname})
              </span>
            )}
          </div>

          {(contact.jobTitle || contact.company) && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
              <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">
                {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Structured Minimal Contact Points (Phone & Email) */}
      <div className="mt-4 space-y-1.5 text-xs">
        {formattedPhone ? (
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 font-mono tabular-nums truncate">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{formattedPhone}</span>
            </div>
            {contact.phones.length > 1 && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                +{contact.phones.length - 1}
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-400 italic text-xs">Sem telefone cadastrado</div>
        )}

        {primaryEmail && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate text-xs">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{primaryEmail}</span>
          </div>
        )}
      </div>

      {/* Clean Unboxed Tags line with typographic separator */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {contact.tags.map((tag, idx) => (
            <React.Fragment key={tag}>
              {idx > 0 && <span aria-hidden="true" className="opacity-40">·</span>}
              <span className="truncate">{tag}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Bottom Action Footer with smooth micro-interactions */}
      <div className="mt-4.5 flex items-center justify-between border-t border-slate-100/90 pt-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-1">
          {primaryPhone && (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Conversar no WhatsApp"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </a>

              <a
                href={telUrl}
                onClick={(e) => e.stopPropagation()}
                title="Ligar para contato"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQr(contact);
            }}
            title="QR Code vCard para Celular"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white transition-all duration-200 hover:-translate-y-0.5"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => onOpenDetails(contact)}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <span>Detalhes</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
