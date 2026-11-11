import React, { useEffect, useState } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Download,
  Check,
  Copy,
  Building,
  Mail,
  Phone,
  Tag,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Contact } from '../types/contact';
import {
  generateVCardQrDataUrl,
  generateNativeVCardString,
} from '../utils/vcard';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface QRCodeModalProps {
  contact: Contact | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ contact, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedVCard, setCopiedVCard] = useState(false);
  const [showRawVCard, setShowRawVCard] = useState(false);

  useEffect(() => {
    if (contact) {
      generateVCardQrDataUrl(contact).then((url) => {
        setQrDataUrl(url);
      });
    } else {
      setQrDataUrl('');
    }
  }, [contact]);

  if (!contact) return null;

  const rawVCard = generateNativeVCardString(contact);
  const primaryPhone = contact.phones[0]?.number || '';
  const primaryEmail = contact.emails[0]?.email || '';

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    anchor.download = `contato_${contact.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    anchor.click();
  };

  const handleCopyVCard = async () => {
    try {
      await navigator.clipboard.writeText(rawVCard);
      setCopiedVCard(true);
      setTimeout(() => setCopiedVCard(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl shadow-slate-900/15 dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08] text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/90 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <QrCode className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                Compartilhamento vCard Nativo
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Padrão vCard 3.0 para Câmera iOS & Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contact Identity Badge */}
        <div className="mt-4 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-sm tracking-wider">
            {contact.name.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
            {contact.name}
          </h2>
          {(contact.jobTitle || contact.company) && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* QR Code Container with High-Contrast Frame */}
        <div className="my-4 flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-white">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code vCard 3.0 para ${contact.name}`}
                className="h-52 w-52 sm:h-56 sm:w-56 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-52 w-52 sm:h-56 sm:w-56 items-center justify-center text-xs text-slate-400 animate-pulse">
                Gerando vCard 3.0...
              </div>
            )}
          </div>

          {/* iOS & Android Camera Detection Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Salva direto na agenda do iPhone ou Android</span>
          </div>
        </div>

        {/* Payload Preview Tile */}
        <div className="text-left rounded-2xl border border-slate-100 bg-[#F9FAFB] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02] text-xs space-y-1.5">
          {primaryPhone && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="font-mono">{formatPhoneNumber(primaryPhone)}</span>
            </div>
          )}
          {primaryEmail && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
              <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{primaryEmail}</span>
            </div>
          )}
          {contact.address && (contact.address.street || contact.address.city) && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
              <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                {[contact.address.street, contact.address.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Tag className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>Grupos: {contact.tags.join(', ')}</span>
            </div>
          )}
        </div>

        {/* View Raw vCard 3.0 Text Toggle */}
        <div className="mt-3 text-left">
          <button
            type="button"
            onClick={() => setShowRawVCard(!showRawVCard)}
            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {showRawVCard ? '▼ Ocultar código vCard 3.0' : '▶ Ver código vCard 3.0 injetado'}
          </button>

          {showRawVCard && (
            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800">
              {rawVCard}
            </pre>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyVCard}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 transition-all duration-200 hover:-translate-y-0.5"
          >
            {copiedVCard ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">vCard Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar vCard</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Salvar Imagem PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
