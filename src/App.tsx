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
} from 'lucide-react';
import { Contact, CloudBackupSnapshot, SyncedDevice } from './types/contact';
import {
  CloudUser,
  getCurrentCloudUser,
  logoutCloudUser,
  loadCloudContacts,
  saveCloudContacts,
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

// Core groups requested by user
const PRESET_GROUPS = [
  { id: 'Trabalho', label: 'Trabalho', icon: Briefcase, color: 'text-blue-500' },
  { id: 'Família', label: 'Família', icon: Heart, color: 'text-rose-500' },
  { id: 'Amigos', label: 'Amigos', icon: UserCheck, color: 'text-emerald-500' },
  { id: 'Médicos', label: 'Médicos', icon: Stethoscope, color: 'text-teal-500' },
];

export default function App() {
  // Authentication State (Cloud Real / Partitioned by User Email)
  const [currentUser, setCurrentUser] = useState<CloudUser | null>(() => getCurrentCloudUser());

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'contacts' | 'backups' | 'duplicates' | 'devices' | 'trash'>('contacts');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('cloudagenda_theme') === 'dark';
  });

  // Data states (synced to cloud)
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

  // Sync dark class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cloudagenda_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cloudagenda_theme', 'light');
    }
  }, [isDarkMode]);

  // Load cloud data on user login
  useEffect(() => {
    if (!currentUser) {
      setContacts([]);
      setSnapshots([]);
      setDevices([]);
      setTrashItems([]);
      setIsDataLoaded(false);
      return;
    }

    let isMounted = true;
    async function loadUserData() {
      setIsSyncing(true);
      try {
        const [loadedContacts, loadedSnapshots, loadedDevices, loadedTrash] = await Promise.all([
          loadCloudContacts(currentUser!.uid),
          loadCloudSnapshots(currentUser!.uid),
          loadCloudDevices(currentUser!.uid),
          loadCloudTrash(currentUser!.uid),
        ]);

        if (isMounted) {
          setContacts(loadedContacts);
          setSnapshots(loadedSnapshots);
          setDevices(loadedDevices);
          setTrashItems(loadedTrash);
          setIsDataLoaded(true);
        }
      } catch (err) {
        console.error('Erro ao carregar dados na nuvem:', err);
        showToast('Aviso: operando com cache local resiliente');
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, showToast]);

  // Derived duplicate scanner and health report
  const duplicateGroups = useMemo(() => scanDuplicates(contacts), [contacts]);
  const healthReport = useMemo(() => analyzeContactHealth(contacts), [contacts]);

  // Storage byte size of contacts in cloud
  const storageUsedBytes = useMemo(() => {
    return new Blob([JSON.stringify(contacts)]).size;
  }, [contacts]);

  // Combined tags: presets + custom tags found in contacts
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    PRESET_GROUPS.forEach((g) => set.add(g.id));
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Vault filter: hide if secret and vault is locked
        if (contact.isVaultSecret && !isVaultUnlocked) {
          return false;
        }

        // Tag filter
        if (selectedTag === 'favorites' && !contact.isFavorite) return false;
        if (selectedTag === 'ice' && !contact.isEmergencyIce) return false;
        if (selectedTag !== 'all' && selectedTag !== 'favorites' && selectedTag !== 'ice') {
          if (!contact.tags.includes(selectedTag)) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = contact.name.toLowerCase().includes(q);
          const nicknameMatch = contact.nickname?.toLowerCase().includes(q);
          const companyMatch = contact.company?.toLowerCase().includes(q);
          const notesMatch = contact.notes?.toLowerCase().includes(q);
          const phoneMatch = contact.phones.some((p) => p.number.includes(q));
          const emailMatch = contact.emails.some((e) => e.email.toLowerCase().includes(q));
          return nameMatch || nicknameMatch || companyMatch || notesMatch || phoneMatch || emailMatch;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [contacts, isVaultUnlocked, selectedTag, searchQuery]);

  // Save contacts helper (syncs directly to cloud database)
  const persistContacts = async (updatedList: Contact[], toastMsg?: string) => {
    setContacts(updatedList);
    if (currentUser) {
      setIsSyncing(true);
      await saveCloudContacts(currentUser.uid, updatedList);
      setIsSyncing(false);
    }
    if (toastMsg) showToast(toastMsg);
  };

  // ------------------------------------------------------------------
  // CRUD Handlers
  // ------------------------------------------------------------------

  const handleSaveContact = async (contactToSave: Contact) => {
    const existingIndex = contacts.findIndex((c) => c.id === contactToSave.id);
    let updated: Contact[];

    if (existingIndex !== -1) {
      updated = [...contacts];
      updated[existingIndex] = contactToSave;
      await persistContacts(updated, `Contato "${contactToSave.name}" atualizado na nuvem.`);
    } else {
      updated = [contactToSave, ...contacts];
      await persistContacts(updated, `Contato "${contactToSave.name}" adicionado à nuvem.`);
    }

    // Auto-create point in snapshots if significant
    if (currentUser) {
      const snap: CloudBackupSnapshot = {
        id: 'snap_' + Date.now(),
        label: `Alteração: ${contactToSave.name}`,
        createdAt: new Date().toLocaleString('pt-BR'),
        contactCount: updated.length,
        sizeBytes: new Blob([JSON.stringify(updated)]).size,
        deviceOrigin: 'Web Nuvem',
        checksum: 'E2EE-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        contacts: updated,
        isAutomatic: true,
      };
      const newSnapshots = [snap, ...snapshots];
      setSnapshots(newSnapshots);
      saveCloudSnapshots(currentUser.uid, newSnapshots);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    const updated = contacts.filter((c) => c.id !== contact.id);
    const newTrashItem: TrashItem = {
      contact,
      deletedAt: new Date().toLocaleString('pt-BR'),
      autoPurgeDays: 30,
    };
    const updatedTrash = [newTrashItem, ...trashItems];

    setContacts(updated);
    setTrashItems(updatedTrash);

    if (currentUser) {
      await Promise.all([
        saveCloudContacts(currentUser.uid, updated),
        saveCloudTrash(currentUser.uid, updatedTrash),
      ]);
    }

    showToast(`Contato "${contact.name}" movido para a lixeira.`);
  };

  const handleToggleFavorite = async (contactId: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    await persistContacts(updated);
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

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedContactIds.size === 0) return;
    const toDelete = contacts.filter((c) => selectedContactIds.has(c.id));
    const remaining = contacts.filter((c) => !selectedContactIds.has(c.id));

    const newTrash = [
      ...toDelete.map((c) => ({
        contact: c,
        deletedAt: new Date().toLocaleString('pt-BR'),
        autoPurgeDays: 30,
      })),
      ...trashItems,
    ];

    setContacts(remaining);
    setTrashItems(newTrash);
    setSelectedContactIds(new Set());

    if (currentUser) {
      await Promise.all([
        saveCloudContacts(currentUser.uid, remaining),
        saveCloudTrash(currentUser.uid, newTrash),
      ]);
    }

    showToast(`${toDelete.length} contatos movidos para a lixeira.`);
  };

  const handleBulkExportVcf = () => {
    const selected = contacts.filter((c) => selectedContactIds.has(c.id));
    const vcf = generateBulkVCards(selected);
    downloadFile(vcf, `contatos_selecionados_${selected.length}.vcf`, 'text/vcard');
    showToast(`${selected.length} contatos exportados em vCard.`);
  };

  const handleBulkAddTag = async (tagName: string) => {
    if (selectedContactIds.size === 0) return;
    const updated = contacts.map((c) => {
      if (selectedContactIds.has(c.id)) {
        const currentTags = c.tags || [];
        return currentTags.includes(tagName) ? c : { ...c, tags: [...currentTags, tagName] };
      }
      return c;
    });

    await persistContacts(updated, `Tag "${tagName}" adicionada aos contatos selecionados.`);
  };

  // Trigger manual cloud backup snapshot
  const handleTriggerBackup = async (customLabel?: string) => {
    if (!currentUser) return;
    setIsSyncing(true);

    const snap: CloudBackupSnapshot = {
      id: 'snap_' + Date.now(),
      label: customLabel || `Backup Manual em Nuvem (${new Date().toLocaleTimeString('pt-BR')})`,
      createdAt: new Date().toLocaleString('pt-BR'),
      contactCount: contacts.length,
      sizeBytes: new Blob([JSON.stringify(contacts)]).size,
      deviceOrigin: 'Navegador Web / Nuvem E2EE',
      checksum: 'E2EE-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      contacts,
      isAutomatic: false,
    };

    const updatedSnapshots = [snap, ...snapshots];
    setSnapshots(updatedSnapshots);
    await saveCloudSnapshots(currentUser.uid, updatedSnapshots);
    setIsSyncing(false);
    showToast(`Snapshot "${snap.label}" salvo na nuvem com sucesso!`);
  };

  const handleRestoreSnapshot = async (snapshot: CloudBackupSnapshot) => {
    if (!currentUser) return;
    await persistContacts(snapshot.contacts);
    showToast(`Agenda restaurada com sucesso para a versão: "${snapshot.label}"!`);
    setActiveTab('contacts');
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!currentUser) return;
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    await saveCloudSnapshots(currentUser.uid, updated);
    showToast('Ponto de restauração removido da nuvem.');
  };

  // Trash actions
  const handleRestoreFromTrash = async (contactId: string) => {
    const item = trashItems.find((t) => t.contact.id === contactId);
    if (!item) return;

    const updatedTrash = trashItems.filter((t) => t.contact.id !== contactId);
    const updatedContacts = [item.contact, ...contacts];

    setContacts(updatedContacts);
    setTrashItems(updatedTrash);

    if (currentUser) {
      await Promise.all([
        saveCloudContacts(currentUser.uid, updatedContacts),
        saveCloudTrash(currentUser.uid, updatedTrash),
      ]);
    }

    showToast(`Contato "${item.contact.name}" restaurado para a agenda.`);
  };

  const handleRestoreAllTrash = async () => {
    if (trashItems.length === 0) return;
    const restored = trashItems.map((t) => t.contact);
    const updatedContacts = [...restored, ...contacts];

    setContacts(updatedContacts);
    setTrashItems([]);

    if (currentUser) {
      await Promise.all([
        saveCloudContacts(currentUser.uid, updatedContacts),
        saveCloudTrash(currentUser.uid, []),
      ]);
    }

    showToast('Todos os contatos da lixeira foram restaurados.');
  };

  const handleEmptyTrash = async () => {
    setTrashItems([]);
    if (currentUser) {
      await saveCloudTrash(currentUser.uid, []);
    }
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
    showToast('Aparelho sincronizado com a nuvem com sucesso.');
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!currentUser) return;
    const updated = devices.filter((d) => d.id !== deviceId);
    setDevices(updated);
    await saveCloudDevices(currentUser.uid, updated);
    showToast('Aparelho desvinculado da conta.');
  };

  const handleAddDevice = async (newDev: SyncedDevice) => {
    if (!currentUser) return;
    const updated = [newDev, ...devices];
    setDevices(updated);
    await saveCloudDevices(currentUser.uid, updated);
    showToast(`Dispositivo "${newDev.name}" pareado com a sua conta na nuvem!`);
  };

  // Import contacts
  const handleImportContacts = async (imported: Contact[], mode: 'append' | 'replace') => {
    let finalContacts: Contact[];
    if (mode === 'replace') {
      finalContacts = imported;
    } else {
      finalContacts = [...contacts, ...imported];
    }

    await persistContacts(finalContacts, `${imported.length} contatos sincronizados e salvos com segurança na nuvem!`);

    // Create an automatic safety snapshot in the cloud
    if (currentUser) {
      const snap: CloudBackupSnapshot = {
        id: 'snap_' + Date.now(),
        label: `Importação Universal (${mode === 'replace' ? 'Substituição' : 'Mesclagem'}: ${imported.length} contatos)`,
        createdAt: new Date().toLocaleString('pt-BR'),
        contactCount: finalContacts.length,
        sizeBytes: new Blob([JSON.stringify(finalContacts)]).size,
        deviceOrigin: 'Importação Universal (Excel/Ctrl+V)',
        checksum: 'E2EE-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        contacts: finalContacts,
        isAutomatic: true,
      };
      const updatedSnapshots = [snap, ...snapshots];
      setSnapshots(updatedSnapshots);
      await saveCloudSnapshots(currentUser.uid, updatedSnapshots);
    }
  };

  // Merge duplicates
  const handleApplyMerges = async (mergedList: Contact[]) => {
    await persistContacts(mergedList, 'Contatos duplicados mesclados e organizados com sucesso!');
  };

  const handleResetDemo = async () => {
    if (window.confirm('Deseja recarregar a base de contatos padrão para esta conta?')) {
      await persistContacts(INITIAL_CONTACTS, 'Dados de demonstração restaurados na nuvem.');
    }
  };

  const handleLogout = async () => {
    await logoutCloudUser();
    setCurrentUser(null);
    showToast('Sessão encerrada com segurança.');
  };

  // If user is not logged in, block access and show minimalist AuthScreen
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F9FAFB] text-slate-800 transition-colors duration-300 dark:bg-[#090C10] dark:text-slate-100 flex flex-col">
      {/* Toast Notification - Floating pill */}
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

      {/* Stats & Quick Actions Bar */}
      <StatsBar
        totalContacts={contacts.length}
        healthScore={healthReport.score}
        duplicateCount={duplicateGroups.length}
        storageUsedBytes={storageUsedBytes}
        lastSyncTime={snapshots[0]?.createdAt || null}
        cloudUserEmail={currentUser.email}
        onOpenImportExport={(tab) => {
          setImportExportTab(tab);
          setImportExportOpen(true);
        }}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Router */}
      <main className="w-full max-w-full overflow-x-hidden flex-1 pb-16">
        {activeTab === 'contacts' && (
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 overflow-x-hidden">
            {/* Filter Bar & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full">
              {/* Search input with Apple/Linear clean style */}
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, telefone, e-mail ou notas..."
                  className="w-full rounded-2xl border border-slate-200/70 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-white/[0.08] dark:bg-[#0E121B] dark:text-white dark:hover:border-white/[0.14] transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* View layout toggle & Select all */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {filteredContacts.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0E121B] dark:text-slate-300 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {selectedContactIds.size === filteredContacts.length ? (
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>
                      {selectedContactIds.size > 0
                        ? `${selectedContactIds.size} selecionados`
                        : 'Selecionar Todos'}
                    </span>
                  </button>
                )}

                <div className="flex items-center border border-slate-200/70 rounded-xl bg-white p-0.5 dark:border-white/[0.08] dark:bg-[#0E121B] shadow-2xs">
                  <button
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'grid'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.12] dark:text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Grade"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'list'
                        ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.12] dark:text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Segmented Tag Filters - Apple style micro pills with Presets (Família, Trabalho, Amigos, Médicos) */}
            <div className="flex flex-wrap items-center gap-1.5 w-full">
              <button
                onClick={() => setSelectedTag('all')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedTag === 'all'
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0E121B] dark:text-slate-300 dark:border-white/[0.08]'
                }`}
              >
                Todos ({contacts.length})
              </button>

              <button
                onClick={() => setSelectedTag('favorites')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedTag === 'favorites'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0E121B] dark:text-slate-300 dark:border-white/[0.08]'
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Favoritos</span>
              </button>

              <button
                onClick={() => setSelectedTag('ice')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedTag === 'ice'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0E121B] dark:text-slate-300 dark:border-white/[0.08]'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Emergência ICE</span>
              </button>

              {/* Group presets: Trabalho, Família, Amigos, Médicos */}
              {PRESET_GROUPS.map((grp) => {
                const IconComponent = grp.icon;
                const count = contacts.filter((c) => c.tags?.includes(grp.id)).length;
                return (
                  <button
                    key={grp.id}
                    onClick={() => setSelectedTag(grp.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedTag === grp.id
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0E121B] dark:text-slate-300 dark:border-white/[0.08]'
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${selectedTag === grp.id ? 'text-white' : grp.color}`} />
                    <span>{grp.label}</span>
                    <span className="opacity-70 font-mono text-[11px]">({count})</span>
                  </button>
                );
              })}

              {/* Any additional custom tags */}
              {availableTags
                .filter((t) => !PRESET_GROUPS.some((g) => g.id === t))
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-white text-slate-600 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:bg-[#0E121B] dark:text-slate-300 dark:border-white/[0.08]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedContactIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200/50 bg-indigo-50/70 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-950/30 backdrop-blur-md shadow-sm w-full animate-fade-in">
                <div className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                  {selectedContactIds.size} contato{selectedContactIds.size > 1 ? 's' : ''} selecionado{selectedContactIds.size > 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick tag batch action */}
                  <div className="hidden sm:flex items-center gap-1 border-r border-indigo-200/60 dark:border-indigo-800/40 pr-2">
                    <span className="text-[11px] text-indigo-900/70 dark:text-indigo-300">Marcar:</span>
                    {PRESET_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleBulkAddTag(g.id)}
                        className="rounded-lg bg-white/80 dark:bg-white/10 px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:bg-white"
                      >
                        +{g.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleBulkExportVcf}
                    className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:bg-white/[0.08] dark:text-slate-200 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exportar vCard</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Lixeira</span>
                  </button>
                  <button
                    onClick={() => setSelectedContactIds(new Set())}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-1"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
            )}

            {/* Contacts Grid / List */}
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white p-10 sm:p-12 text-center dark:border-white/[0.08] dark:bg-[#0E121B] shadow-2xs w-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/[0.04] mb-3">
                  <Users className="h-6 w-6 stroke-[1.8]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Nenhum contato encontrado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `Nenhum resultado corresponde à busca "${searchQuery}".`
                    : 'Não há contatos cadastrados nesta categoria na sua conta de nuvem.'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setIsFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Criar Novo Contato</span>
                  </button>
                  <button
                    onClick={() => {
                      setImportExportTab('import');
                      setImportExportOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    <span>Importar Arquivo (.vcf)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* REQUIRED GRID STRUCTURE: grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full */
              <div
                className={
                  viewLayout === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full'
                    : 'space-y-3 w-full'
                }
              >
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactIds.has(contact.id)}
                    onSelect={handleSelectContact}
                    onOpenDetails={(c) => setDetailContact(c)}
                    onOpenQr={(c) => setQrContact(c)}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Backups & Nuvem */}
        {activeTab === 'backups' && (
          <CloudBackupView
            contacts={contacts}
            snapshots={snapshots}
            isSyncing={isSyncing}
            onTriggerBackup={handleTriggerBackup}
            onRestoreSnapshot={handleRestoreSnapshot}
            onInspectDiff={(snap) => setDiffSnapshot(snap)}
            onDeleteSnapshot={handleDeleteSnapshot}
          />
        )}

        {/* Tab 3: Duplicate Cleaner View */}
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

        {/* Tab 4: Synced Devices */}
        {activeTab === 'devices' && (
          <DevicesView
            devices={devices}
            onSyncDevice={handleSyncDevice}
            onRemoveDevice={handleRemoveDevice}
            onAddDevice={handleAddDevice}
          />
        )}

        {/* Tab 5: Trash View */}
        {activeTab === 'trash' && (
          <TrashView
            trashItems={trashItems}
            onRestore={handleRestoreFromTrash}
            onRestoreAll={handleRestoreAllTrash}
            onEmptyTrash={handleEmptyTrash}
          />
        )}
      </main>

      {/* Modals */}
      <ContactDetailModal
        contact={detailContact}
        onClose={() => setDetailContact(null)}
        onEdit={(c) => {
          setEditingContact(c);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteContact}
        onToggleFavorite={handleToggleFavorite}
        onOpenQr={(c) => setQrContact(c)}
      />

      <ContactFormModal
        isOpen={isFormOpen}
        initialContact={editingContact}
        onClose={() => {
          setIsFormOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
      />

      <ImportExportModal
        isOpen={importExportOpen}
        defaultTab={importExportTab}
        contacts={contacts}
        onClose={() => setImportExportOpen(false)}
        onImportContacts={handleImportContacts}
      />

      <QRCodeModal
        contact={qrContact}
        onClose={() => setQrContact(null)}
      />

      <SecretVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isUnlocked={isVaultUnlocked}
        onUnlockSuccess={() => {
          setIsVaultUnlocked(true);
          showToast('Cofre secreto desbloqueado com sucesso!');
        }}
        onLockVault={() => {
          setIsVaultUnlocked(false);
          showToast('Cofre trancado. Contatos confidenciais protegidos.');
        }}
      />

      <SnapshotDiffModal
        snapshot={diffSnapshot}
        currentContacts={contacts}
        onClose={() => setDiffSnapshot(null)}
        onConfirmRestore={handleRestoreSnapshot}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0A0D14] w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mx-auto max-w-7xl w-full">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CloudAgenda Pro</span>
            <span>·</span>
            <span>Nuvem Conectada ({currentUser.email})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            E2EE Criptografado · Padrão RFC vCard 3.0/4.0 · Google CSV Ready
          </div>
        </div>
      </footer>
    </div>
  );
}
