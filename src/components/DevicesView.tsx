import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Monitor,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Radio,
  QrCode,
  Key,
} from 'lucide-react';
import { SyncedDevice } from '../types/contact';

interface DevicesViewProps {
  devices: SyncedDevice[];
  onSyncDevice: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  onAddDevice: (device: SyncedDevice) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onSyncDevice,
  onRemoveDevice,
  onAddDevice,
}) => {
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  const handleSyncClick = (id: string) => {
    setSyncingDeviceId(id);
    onSyncDevice(id);
    setTimeout(() => {
      setSyncingDeviceId(null);
    }, 1200);
  };

  const handlePairSimulatedDevice = (platform: 'ios' | 'android' | 'macos' | 'windows') => {
    const names = {
      ios: 'iPad Pro 13" (M4)',
      android: 'Google Pixel 9 Pro Fold',
      macos: 'Mac mini M4 Pro',
      windows: 'ThinkPad X1 Carbon Gen 12',
    };
    const models = {
      ios: 'iPadOS 18.2',
      android: 'Android 15',
      macos: 'macOS 15.3 Sequoia',
      windows: 'Windows 11 Pro 24H2',
    };

    const newDev: SyncedDevice = {
      id: `dev_${Date.now()}`,
      name: names[platform],
      model: models[platform],
      platform,
      lastSyncAt: 'Agora mesmo',
      status: 'active',
      clientVersion: 'v4.2.0',
      ipLocation: 'São Paulo, Brasil',
    };

    onAddDevice(newDev);
    setShowPairModal(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dispositivos Sincronizados em Nuvem
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Todos os telefones, tablets e computadores conectados à sua conta CloudAgenda Pro.
          </p>
        </div>

        <button
          onClick={() => setShowPairModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-all duration-300 hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Parear Novo Aparelho</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-4.5 text-xs text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/8 dark:text-emerald-300 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Radio className="h-4.5 w-4.5 text-emerald-600 animate-pulse shrink-0" />
          <div>
            <span className="font-semibold">Sync Hub Bidirecional Ativo: </span>
            <span className="opacity-90">Qualquer contato adicionado ou editado neste navegador é replicado em milissegundos para todos os aparelhos ativos.</span>
          </div>
        </div>
        <span className="font-mono text-[11px] font-medium hidden md:inline shrink-0 opacity-80">
          TLS 1.3 / WebSocket Push
        </span>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((dev) => {
          const isCurrentSyncing = syncingDeviceId === dev.id;

          return (
            <div
              key={dev.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 dark:border-white/[0.06] dark:bg-[#0E121B]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-indigo-600 dark:bg-white/[0.04] dark:text-indigo-400">
                      {dev.platform === 'ios' || dev.platform === 'android' ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {dev.name}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {dev.model} · {dev.clientVersion}
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Ativo
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Último sync confirmado:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{dev.lastSyncAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Localização aproximada:</span>
                    <span className="text-slate-700 dark:text-slate-300">{dev.ipLocation}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={() => handleSyncClick(dev.id)}
                  disabled={isCurrentSyncing}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCurrentSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCurrentSyncing ? 'Enviando contatos...' : 'Forçar Sync Imediato'}</span>
                </button>

                <button
                  onClick={() => onRemoveDevice(dev.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Desvincular este aparelho"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pairing Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#0E121B] border border-slate-100 dark:border-white/[0.08] text-center">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Vincular Novo Dispositivo
              </h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-all duration-200"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-4 text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abra o app CloudAgenda Pro no seu celular ou utilize o código de pareamento seguro abaixo:
              </p>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#F9FAFB] dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                <div className="text-[11px] font-medium text-slate-400 mb-1">Código de Pareamento de 6 Dígitos</div>
                <div className="text-2xl font-bold font-mono tracking-widest text-indigo-600 dark:text-indigo-400">
                  {pairCode.slice(0, 3)} - {pairCode.slice(3)}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Expira em 10 minutos</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ou adicione um simulador para teste imediato:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handlePairSimulatedDevice('ios')}
                    className="rounded-xl border border-slate-200/80 p-3 text-center font-medium text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 transition-all duration-300"
                  >
                    + iPad Pro iOS
                  </button>
                  <button
                    onClick={() => handlePairSimulatedDevice('android')}
                    className="rounded-xl border border-slate-200/80 p-3 text-center font-medium text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 transition-all duration-300"
                  >
                    + Google Pixel 9
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full rounded-xl border border-slate-200/80 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06] transition-all duration-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
