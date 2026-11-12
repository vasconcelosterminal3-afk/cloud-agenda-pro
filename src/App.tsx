import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Star,
  ShieldAlert,
  Grid,
  List,
  Sparkles,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Users,
  CheckCircle,
  FileUp,
  Tag,
  Briefcase,
  Heart,
  UserCheck,
  Stethoscope,
  Cloud,
} from 'lucide-react';
import { Contact, CloudBackupSnapshot, SyncedDevice } from './types/contact';
import {
  AppUser,
  subscribeToAuth,
  logoutFromSupabase,
  subscribeToContacts,
  saveContactToSupabase,
  deleteContactFromSupabase,
  deleteContactsBulkFromSupabase,
  saveContactsBulkToSupabase,
  restoreBackupIntoSupabase,
} from './supabase';
import {
  loadCloudSnapshots,
  saveCloudSnapshots,
  loadCloudDevices,
  saveCloudDevices,
  loadCloudTrash,
  saveCloudTrash,
} from './services/cloudDatabase';
import { scanDuplicates, analyzeContactHealth } from './utils/duplicateScanner';
import { generateBulkVCards, downloadFile } from './utils/vcard';
import { TrashItem } from './utils/storage';
import { INITIAL_CONTACTS } from './data/seedContacts';

import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { AuthScreen } from './components/AuthScreen';
import { ContactCard } from './components/ContactCard';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactFormModal } from './components/ContactFormModal';
import { CloudBackupView } from './components/CloudBackupView';
import { DuplicateCleanerModal } from './components/DuplicateCleanerModal';
import { ImportExportModal } from './components/ImportExportModal';
import { QRCodeModal } from './components/QRCodeModal';
import { SecretVaultModal } from './components/SecretVaultModal';
import { SnapshotDiffModal } from './components/SnapshotDiffModal';
import { DevicesView } from './components/DevicesView';
import { TrashView } from './components/TrashView';

// Preset categories
const PRESET_GROUPS = [
  { id: 'Trabalho', label: 'Trabalho', icon: Briefcase, color: 'text-blue-500' },
  { id: 'Família', label: 'Família', icon: Heart, color: 'text-rose-500' },
  { id: 'Amigos', label: 'Amigos', icon: UserCheck, color: 'text-emerald-500' },
  { id: 'Médicos', label: 'Médicos', icon: Stethoscope, color: 'text-teal-500' },
];

export default function App() {
  // Authentication State via Supabase Auth (with persistent session storage)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'contacts' | 'backups' | 'duplicates' | 'devices' | 'trash'>('contacts');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('cloudagenda_theme') === 'dark';
  });

  // Real-time Supabase synchronized contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [snapshots, setSnapshots] = useState<CloudBackupSnapshot[]>([]);
  const [devices, setDevices] = useState<SyncedDevice[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Active Modals
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [qrContact, setQrContact] = useState<Contact | null>(null);
  const [diffSnapshot, setDiffSnapshot] = useState<CloudBackupSnapshot | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('import');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cloudagenda_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cloudagenda_theme', 'light');
    }
  }, [isDarkMode]);

  // 1. Supabase Auth listener (keeps session active across restarts via Supabase Auth persistent storage)
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Supabase synchronization ('contacts' table filtered by user_id)
  useEffect(() => {
    if (!currentUser) {
      setContacts([]);
      setSnapshots([]);
      setDevices([]);
      setTrashItems([]);
      setIsDataLoaded(false);
      return;
    }

    setIsSyncing(true);

    // Subscribe to Supabase contacts
    const unsubscribeContacts = subscribeToContacts(
      currentUser.uid,
      async (loadedContacts) => {
        // If this is a brand new account with 0 contacts, seed initial demo contacts into Supabase
        if (loadedContacts.length === 0 && !isDataLoaded) {
          try {
            await saveContactsBulkToSupabase(currentUser.uid, INITIAL_CONTACTS);
            return;
          } catch (seedErr) {
            console.warn('Seed contacts warning:', seedErr);
          }
        }
        setContacts(loadedContacts);
        setIsDataLoaded(true);
        setIsSyncing(false);
      },
      (error) => {
        console.error('Supabase subscription error:', error);
        setIsSyncing(false);
      }
    );

    // Load ancillary cloud metadata (snapshots, devices, trash)
    async function loadAuxiliaryData() {
      try {
        const [loadedSnapshots, loadedDevices, loadedTrash] = await Promise.all([
          loadCloudSnapshots(currentUser!.uid),
          loadCloudDevices(currentUser!.uid),
          loadCloudTrash(currentUser!.uid),
        ]);
        setSnapshots(loadedSnapshots);
        setDevices(loadedDevices);
        setTrashItems(loadedTrash);
      } catch (err) {
        console.warn('Erro ao carregar metadados auxiliares:', err);
      }
    }

    loadAuxiliaryData();

    return () => {
      unsubscribeContacts();
    };
  }, [currentUser]);

  // Duplicate Scanner & Health Analytics
  const duplicateGroups = useMemo(() => scanDuplicates(contacts), [contacts]);
  const healthReport = useMemo(() => analyzeContactHealth(contacts), [contacts]);

  // Storage calculation
  const storageUsedBytes = useMemo(() => {
    return new Blob([JSON.stringify(contacts)]).size;
  }, [contacts]);

  // Available tags
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    PRESET_GROUPS.forEach((g) => set.add(g.id));
    contacts.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        if (contact.isVaultSecret && !isVaultUnlocked) {
          return false;
        }

        if (selectedTag === 'favorites' && !contact.isFavorite) return false;
        if (selectedTag === 'ice' && !contact.isEmergencyIce) return false;
        if (selectedTag !== 'all' && selectedTag !== 'favorites' && selectedTag !== 'ice') {
          if (!contact.tags?.includes(selectedTag)) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = contact.name.toLowerCase().includes(q);
          const nicknameMatch = contact.nickname?.toLowerCase().includes(q);
          const companyMatch = contact.company?.toLowerCase().includes(q);
          const notesMatch = contact.notes?.toLowerCase().includes(q);
          const phoneMatch = contact.phones?.some((p) => p.number.includes(q));
          const emailMatch = contact.emails?.some((e) => e.email.toLowerCase().includes(q));
          return nameMatch || nicknameMatch || companyMatch || notesMatch || phoneMatch || emailMatch;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [contacts, isVaultUnlocked, selectedTag, searchQuery]);

  // ------------------------------------------------------------------
  // REAL CLOUD SUPABASE MUTATIONS (contacts table)
  // ------------------------------------------------------------------

  const handleSaveContact = async (contactToSave: Contact) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await saveContactToSupabase(currentUser.uid, contactToSave);
      showToast(`Contato "${contactToSave.name}" salvo no Supabase!`);
    } catch (err: any) {
      console.error('Erro ao salvar no Supabase:', err);
      showToast('Falha ao salvar no Supabase. Verifique a conexão.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!currentUser) return;
    const contactToDelete = contacts.find((c) => c.id === contactId);
    if (!contactToDelete) return;

    setIsSyncing(true);
    try {
      await deleteContactFromSupabase(contactId, currentUser.uid);

      // Save into trash
      const newTrashItem: TrashItem = {
        contact: contactToDelete,
        deletedAt: new Date().toLocaleString('pt-BR'),
        autoPurgeDays: 30,
      };
      const updatedTrash = [newTrashItem, ...trashItems];
      setTrashItems(updatedTrash);
      await saveCloudTrash(currentUser.uid, updatedTrash);

      showToast(`Contato "${contactToDelete.name}" movido para a lixeira.`);
      if (detailContact?.id === contactId) setDetailContact(null);
    } catch (err) {
      console.error('Erro ao apagar contato:', err);
      showToast('Erro ao remover contato.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleFavorite = async (contactId: string) => {
    if (!currentUser) return;
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;

    try {
      await saveContactToSupabase(currentUser.uid, {
        ...target,
        isFavorite: !target.isFavorite,
      });
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  const handleToggleIce = async (contactId: string) => {
    if (!currentUser) return;
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;

    try {
      await saveContactToSupabase(currentUser.uid, {
        ...target,
        isEmergencyIce: !target.isEmergencyIce,
      });
    } catch (err) {
      console.error('Erro ao alternar ICE:', err);
    }
  };

  const handleSelectContact = (contactId: string, selected: boolean) => {
    const next = new Set(selectedContactIds);
    if (selected) next.add(contactId);
    else next.delete(contactId);
    setSelectedContactIds(next);
  };

  const handleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  // Bulk actions in Supabase
  const handleBulkDelete = async () => {
    if (!currentUser || selectedContactIds.size === 0) return;
    const idsToDelete = Array.from(selectedContactIds);
    const toDeleteContacts = contacts.filter((c) => selectedContactIds.has(c.id));

    setIsSyncing(true);
    try {
      await deleteContactsBulkFromSupabase(idsToDelete, currentUser.uid);

      const newTrash = [
        ...toDeleteContacts.map((c) => ({
          contact: c,
          deletedAt: new Date().toLocaleString('pt-BR'),
          autoPurgeDays: 30,
        })),
        ...trashItems,
      ];
      setTrashItems(newTrash);
      await saveCloudTrash(currentUser.uid, newTrash);

      setSelectedContactIds(new Set());
      showToast(`${idsToDelete.length} contatos movidos para a lixeira.`);
    } catch (err) {
      console.error('Erro ao apagar em lote no Supabase:', err);
      showToast('Falha ao apagar contatos em lote.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkExportVcf = () => {
    const selected = contacts.filter((c) => selectedContactIds.has(c.id));
    const vcf = generateBulkVCards(selected);
    downloadFile(vcf, `contatos_selecionados_${selected.length}.vcf`, 'text/vcard');
    showToast(`${selected.length} contatos exportados em vCard.`);
  };

  // Universal Import into Supabase (Excel / JSON / Paste Ctrl+V)
  const handleImportContacts = async (imported: Contact[], mode: 'append' | 'replace') => {
    if (!currentUser) return;
    setIsSyncing(true);

    try {
      if (mode === 'replace') {
        const existingIds = contacts.map((c) => c.id);
        if (existingIds.length > 0) {
          await deleteContactsBulkFromSupabase(existingIds, currentUser.uid);
        }
      }

      await saveContactsBulkToSupabase(currentUser.uid, imported);
      showToast(`${imported.length} contatos gravados no Supabase com sucesso!`);

      // Record snapshot
      const snap: CloudBackupSnapshot = {
        id: 'snap_' + Date.now(),
        label: `Importação Universal (${mode === 'replace' ? 'Substituição' : 'Mesclagem'}: ${imported.length} contatos)`,
        createdAt: new Date().toLocaleString('pt-BR'),
        contactCount: imported.length,
        sizeBytes: new Blob([JSON.stringify(imported)]).size,
        deviceOrigin: 'Importação Universal (Excel/Ctrl+V)',
        checksum: 'SB-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        contacts: imported,
        isAutomatic: true,
      };
      const updatedSnapshots = [snap, ...snapshots];
      setSnapshots(updatedSnapshots);
      await saveCloudSnapshots(currentUser.uid, updatedSnapshots);
    } catch (err) {
      console.error('Erro ao importar contatos:', err);
      showToast('Falha ao sincronizar importação no Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Dedicated JSON Backup restore with deduplication against current Supabase data
  const handleRestoreJsonBackup = async (importedContacts: Contact[]): Promise<{ addedCount: number; skippedCount: number }> => {
    if (!currentUser) return { addedCount: 0, skippedCount: 0 };
    setIsSyncing(true);
    try {
      const res = await restoreBackupIntoSupabase(currentUser.uid, importedContacts, contacts);
      showToast(`${res.addedCount} novos contatos restaurados no Supabase (${res.skippedCount} duplicados ignorados).`);
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual snapshot trigger
  const handleTriggerBackup = async (customLabel?: string) => {
    if (!currentUser) return;
    setIsSyncing(true);

    const snap: CloudBackupSnapshot = {
      id: 'snap_' + Date.now(),
      label: customLabel || `Snapshot Manual no Supabase (${new Date().toLocaleTimeString('pt-BR')})`,
      createdAt: new Date().toLocaleString('pt-BR'),
      contactCount: contacts.length,
      sizeBytes: new Blob([JSON.stringify(contacts)]).size,
      deviceOrigin: 'Navegador Web / Supabase Cloud',
      checksum: 'E2EE-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      contacts,
      isAutomatic: false,
    };

    const updatedSnapshots = [snap, ...snapshots];
    setSnapshots(updatedSnapshots);
    await saveCloudSnapshots(currentUser.uid, updatedSnapshots);
    setIsSyncing(false);
    showToast(`Snapshot "${snap.label}" registrado no Supabase!`);
  };

  const handleRestoreSnapshot = async (snapshot: CloudBackupSnapshot) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await saveContactsBulkToSupabase(currentUser.uid, snapshot.contacts);
      showToast(`Agenda restaurada para o snapshot: "${snapshot.label}"!`);
      setActiveTab('contacts');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!currentUser) return;
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    await saveCloudSnapshots(currentUser.uid, updated);
    showToast('Ponto de restauração removido.');
  };

  // Trash actions
  const handleRestoreFromTrash = async (contactId: string) => {
    if (!currentUser) return;
    const item = trashItems.find((t) => t.contact.id === contactId);
    if (!item) return;

    await saveContactToSupabase(currentUser.uid, item.contact);
    const updatedTrash = trashItems.filter((t) => t.contact.id !== contactId);
    setTrashItems(updatedTrash);
    await saveCloudTrash(currentUser.uid, updatedTrash);

    showToast(`Contato "${item.contact.name}" restaurado.`);
  };

  const handleRestoreAllTrash = async () => {
    if (!currentUser || trashItems.length === 0) return;
    const restored = trashItems.map((t) => t.contact);
    await saveContactsBulkToSupabase(currentUser.uid, restored);
    setTrashItems([]);
    await saveCloudTrash(currentUser.uid, []);
    showToast('Todos os contatos da lixeira foram restaurados.');
  };

  const handleEmptyTrash = async () => {
    if (!currentUser) return;
    setTrashItems([]);
    await saveCloudTrash(currentUser.uid, []);
    showToast('Lixeira esvaziada permanentemente.');
  };

  // Device actions
  const handleSyncDevice = async (deviceId: string) => {
    if (!currentUser) return;
    const updated = devices.map((d) =>
      d.id === deviceId
        ? {
            ...d,
            lastSyncAt: 'Agora mesmo',
            status: 'active' as const,
          }
        : d
    );
    setDevices(updated);
    await saveCloudDevices(currentUser.uid, updated);
    showToast('Aparelho sincronizado com a nuvem do Supabase.');
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!currentUser) return;
    const updated = devices.filter((d) => d.id !== deviceId);
    setDevices(updated);
    await saveCloudDevices(currentUser.uid, updated);
    showToast('Aparelho desvinculado.');
  };

  const handleAddDevice = async (newDev: SyncedDevice) => {
    if (!currentUser) return;
    const updated = [newDev, ...devices];
    setDevices(updated);
    await saveCloudDevices(currentUser.uid, updated);
    showToast(`Dispositivo "${newDev.name}" pareado com sucesso!`);
  };

  const handleApplyMerges = async (mergedList: Contact[]) => {
    if (!currentUser) return;
    await saveContactsBulkToSupabase(currentUser.uid, mergedList);
    showToast('Contatos duplicados mesclados com sucesso no Supabase!');
  };

  const handleLogout = async () => {
    await logoutFromSupabase();
    setCurrentUser(null);
    showToast('Sessão encerrada com segurança.');
  };

  // If Supabase Auth is checking stored credentials, show subtle non-blocking splash
  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] dark:bg-[#090C10]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/25 animate-pulse">
            <Cloud className="h-7 w-7 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Carregando CloudAgenda Pro...
          </span>
        </div>
      </div>
    );
  }

  // If user is not logged in, show AuthScreen with Login / Register and "Lembrar meu login"
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F9FAFB] text-slate-800 transition-colors duration-300 dark:bg-[#090C10] dark:text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-900/95 px-4.5 py-3 text-xs font-medium text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 animate-slide-up">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewContact={() => {
          setEditingContact(null);
          setIsFormOpen(true);
        }}
        onInstantBackup={() => handleTriggerBackup()}
        isSyncing={isSyncing}
        isVaultUnlocked={isVaultUnlocked}
        onToggleVault={() => setIsVaultModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        duplicateCount={duplicateGroups.length}
        trashCount={trashItems.length}
      />

      {/* Dashboard Stats Banner */}
      <StatsBar
        totalContacts={contacts.length}
        healthScore={healthReport.score}
        duplicateCount={duplicateGroups.length}
        storageUsedBytes={storageUsedBytes}
        lastSyncTime={isSyncing ? 'Sincronizando...' : 'Supabase Conectado'}
        cloudUserEmail={currentUser.email}
        onOpenImportExport={(tab) => {
          setImportExportTab(tab);
          setImportExportOpen(true);
        }}
        onResetDemo={() => handleTriggerBackup('Ponto de Segurança')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* TAB 1: CONTATOS */}
        {activeTab === 'contacts' && (
          <div className="space-y-5">
            {/* Action Bar: Search, Category Filters, View Switcher & Action Buttons */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, telefone, e-mail ou empresa..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white transition-all shadow-2xs"
                />
              </div>

              {/* Group / Tag Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedTag === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-300'
                  }`}
                >
                  Todos ({contacts.length})
                </button>

                <button
                  onClick={() => setSelectedTag('favorites')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedTag === 'favorites'
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-300'
                  }`}
                >
                  <Star className="h-3 w-3 fill-current" />
                  <span>Favoritos</span>
                </button>

                <button
                  onClick={() => setSelectedTag('ice')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedTag === 'ice'
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                      : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-300'
                  }`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  <span>SOS / ICE</span>
                </button>

                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50 dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* View layout & Import CTA */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => {
                    setImportExportTab('import');
                    setImportExportOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <FileUp className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Importar</span>
                </button>

                <div className="flex items-center p-0.5 rounded-xl border border-slate-200/60 bg-white dark:border-white/[0.08] dark:bg-white/[0.04]">
                  <button
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'grid'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.12] dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Grade"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'list'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.12] dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Lista"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selection Bar (When items are checked) */}
            {selectedContactIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50 animate-slide-up">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span>{selectedContactIds.size} contatos selecionados</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkExportVcf}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-slate-700 text-xs font-semibold border border-indigo-200/60 shadow-2xs hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-white/[0.08] transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Exportar vCard</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200/80 shadow-2xs hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Mover para Lixeira</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contacts Grid: 100% fluid responsive grid without horizontal overflow */}
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white/60 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500 mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Nenhum contato encontrado
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Não encontramos registros para o filtro ou busca selecionada. Crie um novo contato ou importe uma planilha.
                </p>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setIsFormOpen(true);
                  }}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cadastrar Primeiro Contato</span>
                </button>
              </div>
            ) : viewLayout === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactIds.has(contact.id)}
                    onSelect={(contactId: string, selected: boolean) => handleSelectContact(contactId, selected)}
                    onOpenDetails={(c) => setDetailContact(c)}
                    onOpenQr={(c) => setQrContact(c)}
                    onToggleFavorite={(id) => handleToggleFavorite(id)}
                    onDelete={(c) => handleDeleteContact(c.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0E121B] divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setDetailContact(contact)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-2xs">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {contact.phones?.[0]?.number || 'Sem telefone'} • {contact.company || 'Sem empresa'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {contact.tags?.map((t) => (
                        <span key={t} className="hidden sm:inline px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BACKUP & SEGURANÇA */}
        {activeTab === 'backups' && (
          <CloudBackupView
            snapshots={snapshots}
            contacts={contacts}
            onRestoreSnapshot={handleRestoreSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            onTriggerBackup={(label) => handleTriggerBackup(label)}
            onInspectDiff={(snap) => setDiffSnapshot(snap)}
            onRestoreJsonBackup={handleRestoreJsonBackup}
            isSyncing={isSyncing}
          />
        )}

        {/* TAB 3: OTIMIZADOR DE DUPLICATAS */}
        {activeTab === 'duplicates' && (
          <DuplicateCleanerModal
            contacts={contacts}
            onApplyMerges={handleApplyMerges}
            onClose={() => setActiveTab('contacts')}
            onEditContact={(c) => {
              setEditingContact(c);
              setIsFormOpen(true);
            }}
          />
        )}

        {/* TAB 4: APARELHOS SINCRONIZADOS */}
        {activeTab === 'devices' && (
          <DevicesView
            devices={devices}
            onSyncDevice={handleSyncDevice}
            onRemoveDevice={handleRemoveDevice}
            onAddDevice={handleAddDevice}
          />
        )}

        {/* TAB 5: LIXEIRA DE CONTATOS */}
        {activeTab === 'trash' && (
          <TrashView
            trashItems={trashItems}
            onRestore={handleRestoreFromTrash}
            onRestoreAll={handleRestoreAllTrash}
            onEmptyTrash={handleEmptyTrash}
          />
        )}
      </main>

      {/* MODALS */}
      {detailContact && (
        <ContactDetailModal
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onEdit={(c) => {
            setEditingContact(c);
            setDetailContact(null);
            setIsFormOpen(true);
          }}
          onDelete={(c) => handleDeleteContact(c.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          onOpenQr={(c) => setQrContact(c)}
        />
      )}

      {isFormOpen && (
        <ContactFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingContact(null);
          }}
          initialContact={editingContact}
          onSave={handleSaveContact}
        />
      )}

      {qrContact && (
        <QRCodeModal
          contact={qrContact}
          onClose={() => setQrContact(null)}
        />
      )}

      {diffSnapshot && (
        <SnapshotDiffModal
          snapshot={diffSnapshot}
          currentContacts={contacts}
          onClose={() => setDiffSnapshot(null)}
          onConfirmRestore={handleRestoreSnapshot}
        />
      )}

      {importExportOpen && (
        <ImportExportModal
          isOpen={importExportOpen}
          onClose={() => setImportExportOpen(false)}
          defaultTab={importExportTab}
          contacts={contacts}
          onImportContacts={handleImportContacts}
        />
      )}

      {isVaultModalOpen && (
        <SecretVaultModal
          isOpen={isVaultModalOpen}
          onClose={() => setIsVaultModalOpen(false)}
          isUnlocked={isVaultUnlocked}
          onUnlockSuccess={() => {
            setIsVaultUnlocked(true);
            showToast('Cofre Secreto Desbloqueado!');
          }}
          onLockVault={() => {
            setIsVaultUnlocked(false);
            showToast('Cofre Secreto Trancado.');
          }}
        />
      )}
    </div>
  );
}
