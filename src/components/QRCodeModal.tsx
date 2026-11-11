import React, { useEffect, useState } from 'react';
import { X, QrCode, Smartphone, Download, Check } from 'lucide-react';
import { Contact } from '../types/contact';
import { generateVCardQrDataUrl, generateVCard, downloadFile } from '../utils/vcard';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface QRCodeModalProps {
  contact: Contact | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ contact, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

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

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = qrDataUrl;
    anchor.download = `qrcode_${contact.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    anchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/10 dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08] text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <QrCode className="h-4 w-4 text-indigo-500" />
            <span>Compartilhamento Instantâneo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Contact Header */}
        <div className="mt-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {contact.name}
          </h3>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {formatPhoneNumber(contact.phones[0]?.number || '')}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="my-5 flex items-center justify-center">
          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code para ${contact.name}`}
                className="h-56 w-56 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-xs text-slate-400 animate-pulse">
                Gerando QR Code vCard...
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-white/[0.04] p-3 rounded-2xl mb-4 border border-slate-100 dark:border-white/[0.06]">
          <Smartphone className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>Aponte a câmera do seu celular para salvar este contato instantaneamente.</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/70 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Salvar Imagem</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-all duration-300 hover:-translate-y-0.5"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
