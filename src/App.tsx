import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
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
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { Contact, CloudBackupSnapshot, SyncedDevice } from './types/contact';
import {
  getSavedContacts,
  saveContacts,
  getSavedSnapshots,
  saveSnapshots,
  getSavedDevices,
  saveDevices,
  getTrash,
  moveToTrash,
  restoreFromTrash,
  emptyTrash,
  createCloudSnapshot,
  deleteCloudSnapshot,
  resetToDemo,
  TrashItem,
} from './utils/storage';
import { scanDuplicates, analyzeContactHealth } from './utils/duplicateScanner';
import { generateBulkVCards, downloadFile } from './utils/vcard';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
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

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'contacts' | 'backups' | 'duplicates' | 'devices' | 'trash'>('contacts');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('cloudagenda_theme') === 'dark';
  });

  // Data states
  const [contacts, setContacts] = useState<Contact[]>(() => getSavedContacts());
  const [snapshots, setSnapshots] = useState<CloudBackupSnapshot[]>(() => getSavedSnapshots());
  const [devices, setDevices] = useState<SyncedDevice[]>(() => getSavedDevices());
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => getTrash());
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

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

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

  // Derived analyses
  const duplicateGroups = useMemo(() => scanDuplicates(contacts), [contacts]);
  const healthReport = useMemo(() => analyzeContactHealth(contacts), [contacts]);

  // Storage byte size of contacts
  const storageUsedBytes = useMemo(() => {
    return new Blob([JSON.stringify(contacts)]).size;
  }, [contacts]);

  // Tags collection
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts
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

  // CRUD Handlers
  const handleSaveContact = (contactToSave: Contact) => {
    const existingIndex = contacts.findIndex((c) => c.id === contactToSave.id);
    let updated: Contact[];

    if (existingIndex !== -1) {
      updated = [...contacts];
      updated[existingIndex] = contactToSave;
      showToast(`Contato "${contactToSave.name}" atualizado com sucesso.`);
    } else {
      updated = [contactToSave, ...contacts];
      showToast(`Contato "${contactToSave.name}" adicionado à agenda.`);
    }

    setContacts(updated);
    saveContacts(updated);

    // Auto-create point in snapshots if significant
    createCloudSnapshot(updated, `Alteração de contato: ${contactToSave.name}`);
    setSnapshots(getSavedSnapshots());
  };

  const handleDeleteContact = (contact: Contact) => {
    moveToTrash(contact);
    setContacts(getSavedContacts());
    setTrashItems(getTrash());
    showToast(`Contato "${contact.name}" movido para a lixeira.`);
  };

  const handleToggleFavorite = (contactId: string) => {
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setContacts(updated);
    saveContacts(updated);
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
  const handleBulkDelete = () => {
    if (selectedContactIds.size === 0) return;
    const toDelete = contacts.filter((c) => selectedContactIds.has(c.id));
    toDelete.forEach((c) => moveToTrash(c));
    setContacts(getSavedContacts());
    setTrashItems(getTrash());
    setSelectedContactIds(new Set());
    showToast(`${toDelete.length} contatos movidos para a lixeira.`);
  };

  const handleBulkExportVcf = () => {
    const selected = contacts.filter((c) => selectedContactIds.has(c.id));
    const vcf = generateBulkVCards(selected);
    downloadFile(vcf, `contatos_selecionados_${selected.length}.vcf`, 'text/vcard');
    showToast(`${selected.length} contatos exportados em vCard.`);
  };

  // Instant Cloud Backup
  const handleTriggerBackup = (customLabel?: string) => {
    setIsSyncing(true);
    setTimeout(() => {
      const snap = createCloudSnapshot(contacts, customLabel || 'Backup Instantâneo em Nuvem');
      setSnapshots(getSavedSnapshots());
      setIsSyncing(false);
      showToast(`Snapshot "${snap.label}" criado e salvo na nuvem.`);
    }, 800);
  };

  // Restore snapshot
  const handleRestoreSnapshot = (snapshot: CloudBackupSnapshot) => {
    saveContacts(snapshot.contacts);
    setContacts(snapshot.contacts);
    showToast(`Agenda restaurada com sucesso para: "${snapshot.label}"!`);
    setActiveTab('contacts');
  };

  const handleDeleteSnapshot = (id: string) => {
    deleteCloudSnapshot(id);
    setSnapshots(getSavedSnapshots());
    showToast('Ponto de restauração removido da nuvem.');
  };

  // Trash actions
  const handleRestoreFromTrash = (contactId: string) => {
    const restored = restoreFromTrash(contactId);
    if (restored) {
      setContacts(getSavedContacts());
      setTrashItems(getTrash());
      showToast(`Contato "${restored.name}" restaurado para a agenda.`);
    }
  };

  const handleRestoreAllTrash = () => {
    const currentTrash = getTrash();
    currentTrash.forEach((item) => restoreFromTrash(item.contact.id));
    setContacts(getSavedContacts());
    setTrashItems([]);
    showToast('Todos os contatos da lixeira foram restaurados.');
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setTrashItems([]);
    showToast('Lixeira esvaziada permanentemente.');
  };

  // Device actions
  const handleSyncDevice = (deviceId: string) => {
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
    saveDevices(updated);
    showToast('Contatos sincronizados com o aparelho com sucesso.');
  };

  const handleRemoveDevice = (deviceId: string) => {
    const updated = devices.filter((d) => d.id !== deviceId);
    setDevices(updated);
    saveDevices(updated);
    showToast('Aparelho desvinculado da sua conta de nuvem.');
  };

  const handleAddDevice = (newDev: SyncedDevice) => {
    const updated = [newDev, ...devices];
    setDevices(updated);
    saveDevices(updated);
    showToast(`Dispositivo "${newDev.name}" pareado e sincronizado!`);
  };

  // Import contacts
  const handleImportContacts = (imported: Contact[], mode: 'append' | 'replace') => {
    let finalContacts: Contact[];
    if (mode === 'replace') {
      // Create rollback snapshot first
      createCloudSnapshot(contacts, 'Backup Automático Pré-Substituição');
      finalContacts = imported;
    } else {
      finalContacts = [...contacts, ...imported];
    }

    saveContacts(finalContacts);
    setContacts(finalContacts);
    createCloudSnapshot(finalContacts, `Importação de ${imported.length} contatos`);
    setSnapshots(getSavedSnapshots());
    showToast(`${imported.length} contatos importados com sucesso!`);
  };

  // Merges
  const handleApplyMerges = (mergedList: Contact[]) => {
    saveContacts(mergedList);
    setContacts(mergedList);
    createCloudSnapshot(mergedList, 'Limpeza e Mesclagem de Duplicados');
    setSnapshots(getSavedSnapshots());
    showToast('Contatos mesclados e duplicados removidos com sucesso!');
  };

  const handleResetDemo = () => {
    if (window.confirm('Deseja recarregar a base de contatos e backups de demonstração?')) {
      resetToDemo();
      setContacts(getSavedContacts());
      setSnapshots(getSavedSnapshots());
      setDevices(getSavedDevices());
      setTrashItems([]);
      showToast('Dados de demonstração restaurados.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:border-slate-800 animate-slide-up">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
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
        onOpenImportExport={(tab) => {
          setImportExportTab(tab);
          setImportExportOpen(true);
        }}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'contacts' && (
          <div className="mx-auto max-w-7xl p-6 space-y-6">
            {/* Filter Bar & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, telefone, e-mail ou notas..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* View layout toggle & Select all */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {filteredContacts.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {selectedContactIds.size === filteredContacts.length ? (
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
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

                <div className="flex items-center border border-slate-200 rounded-lg bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-md ${
                      viewLayout === 'grid'
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Grade"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewLayout('list')}
                    className={`p-1.5 rounded-md ${
                      viewLayout === 'list'
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Segmented Tag Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedTag('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
              >
                Todos ({contacts.length})
              </button>

              <button
                onClick={() => setSelectedTag('favorites')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTag === 'favorites'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Favoritos</span>
              </button>

              <button
                onClick={() => setSelectedTag('ice')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTag === 'ice'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Emergência ICE</span>
              </button>

              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedContactIds.size > 0 && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/40 animate-fade-in">
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {selectedContactIds.size} contato{selectedContactIds.size > 1 ? 's' : ''} selecionado{selectedContactIds.size > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkExportVcf}
                    className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exportar vCard</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Mover para Lixeira</span>
                  </button>
                  <button
                    onClick={() => setSelectedContactIds(new Set())}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-2"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
            )}

            {/* Contacts Grid / List */}
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <Users className="h-10 w-10 text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Nenhum contato encontrado
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {searchQuery
                    ? `Nenhum resultado corresponde à busca "${searchQuery}".`
                    : 'Não há contatos neste filtro no momento.'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setIsFormOpen(true);
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    + Criar Novo Contato
                  </button>
                  <button
                    onClick={() => {
                      setImportExportTab('import');
                      setImportExportOpen(true);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Importar Arquivo (.vcf)
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={
                  viewLayout === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-3'
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
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CloudAgenda Pro</span>
            <span>·</span>
            <span>Backup e Sincronização em Nuvem de Contatos Telefônicos</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            E2EE Criptografado · Padrão RFC vCard 3.0/4.0 · Google CSV Ready
          </div>
        </div>
      </footer>
    </div>
  );
}
